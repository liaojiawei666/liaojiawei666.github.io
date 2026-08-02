---
title: 第三章：时钟中断与任务调度
description: 通过任务切换与时钟中断，让多个任务交替使用处理器。
type: project
status: active
---

本章只解决两个核心问题：任务怎样在彼此无感的情况下交替执行，以及内核怎样借助时钟中断定期收回 CPU。

## 1. 本章的核心

**任务切换**：任务运行到一半时，内核保存它当前的执行现场，换成另一个任务的执行现场。以后再次切换回来时，原任务会从被暂停的位置继续执行，就像从未离开过 CPU。

**时钟中断**：如果只能等待任务主动交出 CPU，一个不主动让出的任务就会一直运行。时钟中断会周期性地打断当前任务，让内核重新获得控制权，并决定是否切换任务。

任务切换负责“怎样换”，时钟中断负责“何时获得换的机会”。

## 2. 核心思路

先看整体内存分布。内核、应用以及每个应用对应的内核栈和用户栈必须各有固定位置，任务切换才能保存一个任务的现场，再安全地恢复另一个任务。

![内核、应用与任务栈的整体内存分布](/diagrams/riscv-rust-os/task-memory-layout.drawio.svg)

内核从 `0x8020_0000` 开始，应用区域从 `0x8040_0000` 开始。每个应用槽位中仍然按照 ELF 的 `.text`、`.rodata`、`.data`、`.bss` 顺序放置各段。

内核本身也由这些段组成。它在 `.bss` 中为 `n` 个应用各预留一份内核栈和一份用户栈，使每个任务都使用独立的栈空间。

任务的执行现场由 `TrapContext` 和 `TaskContext` 共同保存。下图中，虚线表示结构放大，实线箭头表示字段中保存的地址。

![TrapContext、TaskContext、栈与恢复入口的指针关系](/diagrams/riscv-rust-os/task-context-pointers.drawio.svg)

每个任务的 `TrapContext` 放在其内核栈栈顶，用来保存用户态现场：`x[2]` 指向用户栈，`sepc` 指向触发 Trap 的指令。`TaskContext` 则集中存放在内核 `.data` 节的数组中，用来保存内核态现场：`sp` 指向任务暂停时的内核栈位置，初次运行时 `ra` 指向 `__restore`。

`__switch` 只切换 `s0..s11`、`sp` 和 `ra`。左右两个 CPU 框表示同一组寄存器在切换前后的两个快照。

![__switch 保存当前任务并加载下一个任务的过程](/diagrams/riscv-rust-os/task-switch-process.drawio.svg)

它先把 CPU 寄存器保存到 `TaskContext[i]`，再从 `TaskContext[j]` 加载寄存器。加载完成后，CPU 的 `sp` 指向任务 `j` 的内核栈，`ret` 沿任务 `j` 的 `ra` 继续执行。
