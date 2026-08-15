---
title: RISC-V 核心手册
description: 用一篇文章概括 RISC-V 操作系统开发需要的指令集、寄存器、特权级、Trap、SBI 与虚拟内存知识。
type: project
status: active
---

RISC-V 是软件与处理器之间的接口。开发 RV64 操作系统时，真正需要掌握的是：程序员可见状态、基本指令、特权级、Trap、SBI 和地址转换。

## RISC-V 规定了什么

RISC-V 是指令集架构（Instruction Set Architecture，ISA），规定指令、寄存器、异常和特权级。它不规定处理器必须使用几级流水线、多大的缓存或怎样执行乱序调度。

| 层次 | 解决的问题 |
|---|---|
| ISA | 软件可以执行哪些指令，能看到哪些机器状态 |
| 微架构 | 处理器内部如何实现 ISA |
| ABI | 函数参数、返回值、栈和寄存器如何使用 |
| SBI | S 模式软件如何请求更高特权级提供平台服务 |

同一份程序可以运行在不同 RISC-V 处理器上，前提是处理器和运行环境支持程序依赖的 ISA、ABI 与平台接口。

## 看懂 RV64GC

RISC-V 由基础整数指令集和可选扩展组成。`RV64GC` 可以拆成：

| 名称 | 含义 |
|---|---|
| `RV64` | 整数寄存器宽度 `XLEN=64` |
| `G` | `I`、`M`、`A`、`F`、`D`、`Zicsr`、`Zifencei` 的通用组合 |
| `C` | 常用指令的 16 位压缩编码 |

常见扩展如下：

| 扩展 | 提供的能力 |
|---|---|
| `I` | 整数运算、访存和控制流 |
| `M` | 整数乘法与除法 |
| `A` | 原子读改写，用于并发同步 |
| `F` / `D` | 单精度与双精度浮点运算 |
| `C` | 压缩指令，减小代码体积 |
| `V` | 向量运算 |
| `Zicsr` | 读写控制与状态寄存器 |
| `Zifencei` | 同步数据写入与后续取指 |

Rust 目标 `riscv64gc-unknown-none-elf` 表示生成面向 RV64GC、没有现成操作系统运行时的 ELF 程序。

## 程序能看到哪些寄存器

RV64I 有 32 个 64 位整数寄存器 `x0～x31` 和程序计数器 `pc`。除 `x0` 恒为 0 外，其他整数寄存器在硬件层面没有固定用途；`ra`、`sp`、`a0` 等名称来自 ABI。

| 编号 | ABI 名称 | 用途 | 跨函数调用保持 |
|---|---|---|---|
| `x0` | `zero` | 恒为 0，写入被丢弃 | 固定 |
| `x1` | `ra` | 返回地址 | 否 |
| `x2` | `sp` | 栈指针 | 是 |
| `x3` | `gp` | 全局指针 | 固定用途 |
| `x4` | `tp` | 线程指针 | 固定用途 |
| `x5～x7` | `t0～t2` | 临时值 | 否 |
| `x8～x9` | `s0～s1` | 保存值，`s0` 也可作帧指针 | 是 |
| `x10～x17` | `a0～a7` | 参数，`a0～a1` 也传递返回值 | 否 |
| `x18～x27` | `s2～s11` | 保存值 | 是 |
| `x28～x31` | `t3～t6` | 临时值 | 否 |

调用者必须在需要时保存 `ra`、`a*` 和 `t*`；被调用者使用 `s*` 后必须在返回前恢复。`pc` 保存当前执行位置，由跳转、分支和 Trap 返回等指令修改。

CSR（Control and Status Register）保存特权状态。CSR 有独立的 12 位地址空间，通过 `csrrw`、`csrrs`、`csrrc` 等指令访问。浮点扩展和向量扩展还会分别增加 `f0～f31` 与 `v0～v31`。

## 指令如何分类

按助记符统计，[RV32I 有 40 条基础整数指令](https://docs.riscv.org/reference/isa/unpriv/rv32.html)。RV64I 继承它们，并增加 12 条 64 位专用指令，因此共有约 52 条；扩展指令和伪指令不包含在这个数字中。

RISC-V 官方没有把所有相关指令统称为“系统调用指令”或“内存指令”。更准确的分类如下：

| 本文分类 | 官方术语 | 包含内容 |
|---|---|---|
| 基础运算 | Integer Computational Instructions | 整数算术、逻辑、比较与移位 |
| 控制转移 | Control Transfer Instructions | 条件分支、无条件跳转、调用与返回 |
| 加载与存储 | Load and Store Instructions | 在通用寄存器与内存之间传输数据 |
| CSR 访问 | Control and Status Register Instructions | 原子读、写、置位和清位 CSR |
| 环境调用与特权控制 | Environment Call / Privileged Instructions | `ecall`、`sret`、`mret` 等 |
| 内存与地址转换同步 | Memory Ordering / Supervisor Memory-Management Fence | `fence`、`fence.i`、`sfence.vma` |

### 基础运算与控制转移

下面的伪代码省略溢出和异常等细节。

| 写法 | 实际指令 | 伪代码含义 | 描述 |
|---|---|---|---|
| `li rd, imm`（伪） | 小立即数：`addi rd, x0, imm`；大立即数：多条 `lui/addi/...` | `rd = imm` | 将常量写入寄存器，展开方式取决于数值大小 |
| `la rd, symbol`（伪） | 常见展开：`auipc rd, hi20` + `addi rd, rd, lo12` | `rd = &symbol` | 取得符号地址；位置无关代码的展开可能不同 |
| `mv rd, rs`（伪） | `addi rd, rs, 0` | `rd = rs` | 复制寄存器 |
| `nop`（伪） | `addi x0, x0, 0` | `无状态变化` | 空操作 |
| `add rd, rs1, rs2` | `add rd, rs1, rs2` | `rd = rs1 + rs2` | 寄存器加法 |
| `addi rd, rs1, imm` | `addi rd, rs1, imm` | `rd = rs1 + sign_extend(imm)` | 加一个 12 位有符号立即数 |
| `sub rd, rs1, rs2` | `sub rd, rs1, rs2` | `rd = rs1 - rs2` | 寄存器减法 |
| `mul rd, rs1, rs2` | `mul rd, rs1, rs2` | `rd = low_xlen(rs1 * rs2)` | 乘法，属于 `M` 扩展 |
| `div rd, rs1, rs2` | `div rd, rs1, rs2` | `rd = signed(rs1) / signed(rs2)` | 有符号除法，属于 `M` 扩展 |
| `and rd, rs1, rs2` | `and rd, rs1, rs2` | `rd = rs1 & rs2` | 按位与 |
| `or rd, rs1, rs2` | `or rd, rs1, rs2` | `rd = rs1 \| rs2` | 按位或 |
| `xor rd, rs1, rs2` | `xor rd, rs1, rs2` | `rd = rs1 ^ rs2` | 按位异或 |
| `sll rd, rs1, rs2` | `sll rd, rs1, rs2` | `rd = rs1 << rs2` | 逻辑左移 |
| `srl rd, rs1, rs2` | `srl rd, rs1, rs2` | `rd = unsigned(rs1) >> rs2` | 逻辑右移，高位补 0 |
| `sra rd, rs1, rs2` | `sra rd, rs1, rs2` | `rd = signed(rs1) >> rs2` | 算术右移，高位补符号位 |
| `slt rd, rs1, rs2` | `slt rd, rs1, rs2` | `rd = signed(rs1) < signed(rs2)` | 有符号比较，结果为 0 或 1 |
| `sltu rd, rs1, rs2` | `sltu rd, rs1, rs2` | `rd = unsigned(rs1) < unsigned(rs2)` | 无符号比较 |
| `beq rs1, rs2, label` | `beq rs1, rs2, label` | `if rs1 == rs2: PC = label` | 相等时分支，否则执行下一条 |
| `bne rs1, rs2, label` | `bne rs1, rs2, label` | `if rs1 != rs2: PC = label` | 不相等时分支 |
| `blt rs1, rs2, label` | `blt rs1, rs2, label` | `if signed(rs1) < signed(rs2): PC = label` | 有符号小于时分支 |
| `beqz rs, label`（伪） | `beq rs, x0, label` | `if rs == 0: PC = label` | 为零时分支 |
| `bnez rs, label`（伪） | `bne rs, x0, label` | `if rs != 0: PC = label` | 非零时分支 |
| `j label`（伪） | `jal x0, label` | `PC = label` | 无条件跳转，不保存返回地址 |
| `jal rd, label` | `jal rd, label` | `(rd, PC) = (PC + 4, label)` | PC 相对跳转，并保存返回地址 |
| `jalr rd, imm(rs1)` | `jalr rd, imm(rs1)` | `(rd, PC) = (PC + 4, (rs1 + imm) & ~1)` | 通过寄存器间接跳转 |
| `call label`（伪） | 常见展开：`auipc ra, hi20` + `jalr ra, lo12(ra)` | `ra = PC + 4; PC = label` | 调用函数；链接器可能将其放宽为 `jal` |
| `ret`（伪） | `jalr x0, 0(ra)` | `PC = ra` | 从函数返回 |

### 加载与存储

RISC-V 是 load/store 架构：算术指令只操作寄存器，只有 load 和 store 直接访问内存。有效地址统一按下面的方式计算：

```text
address = x[rs1] + sign_extend(imm12)
```

Load 将内存数据写入 `rd`；store 将 `rs2` 的低位写入内存。`lb/lh/lw` 会符号扩展，带 `u` 后缀的 `lbu/lhu/lwu` 会零扩展。

| 指令 | 传输宽度 | 伪代码含义 | RV64 结果 |
|---|---:|---|---|
| `lb rd, imm(rs1)` | 8 位 | `rd = sign_extend(M8[address])` | 符号扩展到 64 位 |
| `lbu rd, imm(rs1)` | 8 位 | `rd = zero_extend(M8[address])` | 零扩展到 64 位 |
| `lh rd, imm(rs1)` | 16 位 | `rd = sign_extend(M16[address])` | 符号扩展到 64 位 |
| `lhu rd, imm(rs1)` | 16 位 | `rd = zero_extend(M16[address])` | 零扩展到 64 位 |
| `lw rd, imm(rs1)` | 32 位 | `rd = sign_extend(M32[address])` | 符号扩展到 64 位 |
| `lwu rd, imm(rs1)` | 32 位 | `rd = zero_extend(M32[address])` | 零扩展到 64 位 |
| `ld rd, imm(rs1)` | 64 位 | `rd = M64[address]` | 保持 64 位 |
| `sb rs2, imm(rs1)` | 8 位 | `M8[address] = low8(rs2)` | 只写入低 8 位 |
| `sh rs2, imm(rs1)` | 16 位 | `M16[address] = low16(rs2)` | 只写入低 16 位 |
| `sw rs2, imm(rs1)` | 32 位 | `M32[address] = low32(rs2)` | 只写入低 32 位 |
| `sd rs2, imm(rs1)` | 64 位 | `M64[address] = rs2` | 写入全部 64 位 |

`M8/M16/M32/M64` 表示对应宽度的内存数据。地址是否允许未对齐访问由运行环境决定；操作系统代码不应假设所有实现都能高效处理未对齐访问。

### CSR 访问

CSR（Control and Status Register）是每个 hart 独立拥有的控制与状态寄存器。它与 `x0～x31` 通用寄存器分属不同空间；指令中的 `csr` 字段是一个 12 位地址，因此最多可编码 4096 个 CSR。

汇编器允许使用 `sstatus`、`sepc` 等名字代替数字地址。伪代码 `CSR[csr]` 表示“CSR 空间中由 `csr` 指定的寄存器”。

[Zicsr 扩展](https://docs.riscv.org/reference/isa/unpriv/zicsr.html)只有 6 条真实指令：

| 数据来源 | 整体写入 W | 按位置 1 S | 按位清 0 C |
|---|---|---|---|
| 通用寄存器 `rs1` | `csrrw` | `csrrs` | `csrrc` |
| 5 位立即数 `uimm` | `csrrwi` | `csrrsi` | `csrrci` |

先掌握寄存器版本即可。把指令画成“执行前 → 执行后”最直观：左侧输入全部取自指令执行前，右侧结果同时生效。

**`csrrw`：整体替换 CSR**

```text
执行前 CSR  ─────────────────→  执行后 rd
执行前 rs1  ─────────────────→  执行后 CSR
```

旧 CSR 进入 `rd`，`rs1` 的值进入 CSR，因此它最接近“交换”。

**`csrrs`：将掩码中为 1 的位置 1**

```text
执行前 CSR  ─────────────────→  执行后 rd
执行前 CSR  ───┐
               ├── OR ──────→  执行后 CSR
执行前 rs1  ───┘
```

**`csrrc`：将掩码中为 1 的位清 0**

```text
执行前 CSR  ─────────────────→  执行后 rd
执行前 CSR  ───┐
               ├── AND ─────→  执行后 CSR
NOT(执行前 rs1) ─┘
```

这三个图表达的是一次原子操作，不是从上到下执行的多条指令。即使 `rd` 和 `rs1` 写成同一个寄存器，输入仍然使用执行前的 `rs1`，不会被输出到 `rd` 的旧 CSR 值覆盖。

这里的 `x[rs1]` 不是要写入 CSR 的普通数值，而是一个位掩码。对于 `csrrc`：

| 原 CSR 位 | 掩码位 | `NOT 掩码位` | 新 CSR 位 | 结果 |
|---:|---:|---:|---:|---|
| `0` | `0` | `1` | `0 AND 1 = 0` | 保持原值 |
| `1` | `0` | `1` | `1 AND 1 = 1` | 保持原值 |
| `0` | `1` | `0` | `0 AND 0 = 0` | 清零 |
| `1` | `1` | `0` | `1 AND 0 = 0` | 清零 |

因此 `旧值 AND NOT 掩码` 的含义就是：

```text
掩码位为 0 → 保留旧位
掩码位为 1 → 把旧位清零
```

例如：

```text
旧值          1011_0100
掩码          0001_0100
NOT 掩码      1110_1011
AND 后的新值  1010_0000
```

掩码中为 1 的两个位置被清零，其他位保持不变。

`rd` 或 `rs1` 使用 `x0` 后，就得到常见的简化操作：

| 想做什么 | 常用写法 | 实际指令 | 箭头表示 |
|---|---|---|---|
| 只读取 | `csrr rd, csr` | `csrrs rd, csr, x0` | `x[rd] ← CSR[csr]` |
| 只写入 | `csrw csr, rs` | `csrrw x0, csr, rs` | `CSR[csr] ← x[rs]` |
| 置位 | `csrs csr, rs` | `csrrs x0, csr, rs` | `CSR[csr] ← CSR[csr] OR x[rs]` |
| 清位 | `csrc csr, rs` | `csrrc x0, csr, rs` | `CSR[csr] ← CSR[csr] AND NOT x[rs]` |

这里 `rd=x0` 表示不保留修改前的 CSR 值；对于 `csrrs/csrrc`，`rs1=x0` 表示掩码全为 0，因此只读取、不修改。

S 模式常用 CSR 如下：

| CSR | 作用 |
|---|---|
| `sstatus` | 当前状态、Trap 前的特权级和中断状态 |
| `stvec` | S 模式 Trap 入口地址和向量模式 |
| `sepc` | Trap 返回地址 |
| `scause` | Trap 是中断还是异常，以及具体编号 |
| `stval` | 出错地址或其他异常附加信息 |
| `sscratch` | 内核自定义临时值，常用于切换 Trap 上下文 |
| `sie` | S 模式各类中断源的独立允许位 |
| `sip` | S 模式各类中断源的待处理状态 |
| `satp` | 分页模式、ASID 和根页表物理页号 |

M 模式存在对应的 `mstatus`、`mtvec`、`mepc`、`mcause`、`mtval`、`mscratch`、`mie` 和 `mip`。CSR 能否访问由当前特权级和 CSR 属性决定，非法访问会触发非法指令异常。

### sstatus 位与常用操作

`sstatus` 的 CSR 地址是 `0x100`，宽度等于 S 模式的 XLEN。它不是一份独立状态，而是 `mstatus` 中允许 S 模式访问的字段视图；读写同名字段会影响同一份处理器状态。

图中只突出当前会使用的字段，灰色部分暂不展开：

![RV64 sstatus 关键字段](/diagrams/riscv-rust-os/sstatus-fields.drawio.svg)

| 位 | 字段 | 当前用途 |
|---:|---|---|
| `19` | `MXR` | 允许 load 读取 `X=1` 的可执行页 |
| `18` | `SUM` | 允许 S 模式 load/store `U=1` 的用户页 |
| `8` | `SPP` | 保存进入 Trap 前的特权级：`0=U`、`1=S` |
| `5` | `SPIE` | 保存进入 Trap 前的 `SIE` |
| `1` | `SIE` | 当前运行在 S 模式时的全局 S 级中断开关 |

`sstatus.SIE` 是全局开关，`sie[i]` 是单个中断源开关，`sip[i]` 是该中断源的待处理状态。进入 S 模式 Trap 需要中断已经路由到 S 模式、`sie[i]=1`、`sip[i]=1`，并且当前在 U 模式或 `sstatus.SIE=1`。

内核通常保持 `SUM=0`，只在受控的用户内存复制路径中临时置 1。即使 `SUM=1`，S 模式仍不能从用户页取指。

修改字段时优先使用置位和清位指令，避免覆盖 `sstatus` 的其他字段：

```asm
# 打开/关闭全局 S 级中断
csrsi sstatus, 2
csrci sstatus, 2

# 临时允许 S 模式访问用户页
li   t0, 1 << 18
csrs sstatus, t0
# ...访问用户内存...
csrc sstatus, t0

# 让 sret 返回 U 模式
li   t0, 1 << 8
csrc sstatus, t0
```

`csrsi/csrci` 的立即数只有 5 位；`SUM`、`MXR`、`SPP` 等高位需要先把掩码放入通用寄存器。[Supervisor ISA 对 `sstatus` 的完整定义](https://docs.riscv.org/reference/isa/priv/supervisor.html)

### 环境调用与陷阱返回

`ecall` 的官方名称是 Environment Call。它请求当前执行环境提供服务，但“服务是什么、参数放在哪里”由执行环境或 ABI 决定，而不是由指令本身规定。

| 指令 | 方向 | 关键动作 | 常见用途 |
|---|---|---|---|
| `ecall` | 低层软件 → Trap 处理程序 | 产生精确异常，记录原因和当前 `pc`，跳到 Trap 入口 | U 模式请求内核系统调用；S 模式请求 SBI 服务 |
| `sret` | S 模式 Trap 处理程序 → 被中断程序 | `pc = sepc`，按 `sstatus.SPP/SPIE` 恢复特权级和中断状态 | 从 S 模式 Trap 返回 |
| `mret` | M 模式 Trap 处理程序 → 被中断程序 | `pc = mepc`，按 `mstatus.MPP/MPIE` 恢复状态 | 从 M 模式 Trap 返回 |

因此，`ecall` 可以用于发起系统调用，但不能直接等同于系统调用；`sret` 更不是系统调用，它是特权级 Trap 返回指令。

一个常见的 U → S 系统调用约定是：

```text
a0～a5 = 参数
a7      = 系统调用号
ecall
→ 内核读取参数并处理
→ sepc += 4
→ 将返回值写入 a0
→ sret
```

寄存器的具体分工属于操作系统 ABI。`ecall` 只负责触发环境调用异常；`sepc += 4` 由内核完成，否则 `sret` 后还会再次执行同一条 `ecall`。

### 内存排序与地址转换同步

下面三条指令都常被简称为“屏障”，但同步的对象不同：

| 指令 | 同步对象 | 作用 |
|---|---|---|
| `fence pred, succ` | 内存和 MMIO 访问 | 约束其他 hart 或设备观察 `pred` 与 `succ` 操作的顺序 |
| `fence.i` | 本 hart 的数据写入与后续取指 | 让后续取指看到本 hart 写入的指令内容 |
| `sfence.vma rs1, rs2` | 页表写入与后续隐式地址转换 | 让页表遍历和地址转换缓存看到新的映射 |

`sfence.vma` 可以缩小同步范围：

| `rs1` | `rs2` | 范围 |
|---|---|---|
| `x0` | `x0` | 所有虚拟地址、所有地址空间 |
| 虚拟地址 | `x0` | 该虚拟地址在所有地址空间中的映射 |
| `x0` | ASID | 该地址空间的非全局映射 |
| 虚拟地址 | ASID | 指定地址空间中的指定虚拟地址 |

`sfence.vma` 不是普通内存屏障，也不等同于简单“清空 TLB”；它定义的是页表更新与后续地址转换之间的顺序，并可能使相关地址转换缓存项失效。

## 特权级与软件栈

RISC-V 定义 U、S、M 三种特权级。实现可以只提供 M，或提供 M+U；运行类 Unix 操作系统通常提供 M+S+U。M 模式必须存在。

| 模式 | 典型软件 | 权限 |
|---|---|---|
| U | 应用程序 | 不能直接控制页表、中断和设备 |
| S | 操作系统内核 | 管理进程、虚拟内存和被委托的中断 |
| M | 固件或运行时 | 控制整台机器，可配置异常与中断委托 |

典型的软件栈如下：

![RISC-V 操作系统软件栈](/diagrams/riscv-rust-os/riscv-software-stack.drawio.svg)

应用程序通过 `ecall` 进入内核。S 模式内核可以直接访问允许的内存和 MMIO，也可以通过 SBI 请求机器级服务。SBI 是接口规范；OpenSBI 是运行在更高特权级的一种实现。

## Trap 如何进入和返回

Trap 是控制流从当前程序切换到处理程序的统一机制。同步产生的 Trap 称为异常，例如非法指令、缺页和 `ecall`；异步产生的 Trap 称为中断，例如定时器和外设中断。

![RISC-V Trap 进入与返回流程](/diagrams/riscv-rust-os/trap-flow.drawio.svg)

Trap 进入 S 模式时，硬件完成：

1. 将被中断或触发异常的指令地址写入 `sepc`；
2. 将原因写入 `scause`，附加信息写入 `stval`；
3. 用 `sstatus.SPP` 记录之前的特权级；
4. 执行 `SPIE ← SIE`，再清零 `SIE`；
5. 将 `pc` 设置为 `stvec` 指定的处理入口。

硬件不会自动保存 `x1～x31`。Trap 入口汇编必须先保存通用寄存器，再调用 Rust 处理函数。返回前恢复现场并执行 `sret`；`sret` 根据 `SPP` 恢复特权级、根据 `SPIE` 恢复中断状态，并令 `pc ← sepc`。

## Sv39 如何转换地址

RV64 常用 Sv39 分页。Sv39 使用 39 位有效虚拟地址、三级页表和 4 KiB 基础页；`satp` 保存分页模式、ASID 和根页表的物理页号。

![Sv39 虚拟地址转换流程](/diagrams/riscv-rust-os/sv39-address-translation.drawio.svg)

虚拟地址由三级虚拟页号 `VPN[2:0]` 和 12 位页内偏移组成。硬件从 `satp.PPN` 指向的根页表开始逐级读取 PTE，最终得到物理页号，再与原页内偏移组成物理地址。

叶子 PTE 的关键标志包括：

| 标志 | 作用 |
|---|---|
| `V` | PTE 是否有效 |
| `R/W/X` | 是否允许读、写、执行 |
| `U` | U 模式是否可以访问 |
| `G` | 是否属于所有地址空间 |
| `A` | 页面是否被访问过 |
| `D` | 页面是否被写过 |

PTE 无效、权限不足或地址格式错误会产生页错误。TLB 缓存最近的地址转换；修改页表后，内核需要按影响范围执行 `sfence.vma`，确保后续访问观察到新的映射。

## 从复位到用户程序

一台典型的 RISC-V 机器按以下顺序运行：

```text
复位并进入 M 模式
→ 固件初始化硬件
→ OpenSBI 将控制权交给 S 模式内核
→ 内核设置栈、清零 BSS
→ 配置 stvec 和 Trap 上下文
→ 建立页表并写入 satp
→ 初始化定时器和外设
→ 构造用户上下文
→ sret 进入 U 模式
```

这条路径把整篇手册串在一起：指令操作寄存器，特权级限制权限，Trap 完成控制权切换，SBI 提供平台服务，页表隔离地址空间。

## 边界

本文只覆盖通用 RV64 操作系统开发所需的最小知识。指令二进制编码、浮点与向量细节、Hypervisor、PMP、PLIC/AIA、弱内存序和微架构实现应在真正需要时单独学习。

## 参考文档

- [RISC-V 非特权指令集规范](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [RISC-V ISA 扩展命名规范](https://docs.riscv.org/reference/isa/unpriv/naming.html)
- [RV32/64G 指令集列表](https://docs.riscv.org/reference/isa/unpriv/rv-32-64g.html)
- [RISC-V ABI 寄存器约定](https://docs.riscv.org/reference/abi/riscv-cc-register-convention.html)
- [RISC-V Supervisor-Level ISA](https://docs.riscv.org/reference/isa/priv/supervisor.html)
- [RISC-V SBI 规范](https://docs.riscv.org/reference/sbi/_attachments/riscv-sbi.pdf)
