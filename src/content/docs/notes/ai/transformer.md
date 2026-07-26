---
title: Transformer 论文解析：Attention Is All You Need
date: 2026-07-13
description: 从整体架构、注意力机制到训练设置，系统梳理 Transformer 原始论文。
---

> 原论文：[Attention Is All You Need](https://arxiv.org/abs/1706.03762)（Vaswani et al., NeurIPS 2017）
>
> 一句话概括：**彻底抛弃 RNN / CNN，只用注意力机制做序列到序列建模**，在机器翻译上刷新 SOTA，并奠定了后世 BERT、GPT 等大模型的架构基础。

---

## 1. 论文要解决什么问题？

2017 年前后，序列建模（尤其是机器翻译）的主流方案是：

- **RNN / LSTM / GRU**：按时间步串行计算，$h_t = f(h_{t-1}, x_t)$，天然难以并行，长序列训练慢。
- **CNN（如 ConvS2S、ByteNet）**：可并行，但远距离依赖需要堆很多层，路径长度随距离增长。
- **Attention**：通常只作为 Encoder-Decoder 之间的「补充」，仍挂在 RNN 之上。

作者的核心主张：

> Attention **本身就够用**。不必再依赖 recurrence 或 convolution。

由此提出 **Transformer**：完全基于注意力的 Encoder-Decoder 架构，优势是：

1. **高度并行**：序列内位置可同时计算。
2. **长程依赖路径短**：任意两位置之间的路径长度为 $O(1)$。
3. **训练更快、效果更好**：英德翻译 BLEU 28.4，英法 41.8，且训练成本远低于当时主流模型。

---

## 2. 整体架构

Transformer 沿用经典的 **Encoder–Decoder** 结构：

- **Encoder**：输入序列 $(x_1,\ldots,x_n) \rightarrow$ 连续表示 $\mathbf{z}=(z_1,\ldots,z_n)$
- **Decoder**：自回归地逐 token 生成 $(y_1,\ldots,y_m)$，每一步都可看到已生成的前文，以及 Encoder 的全部输出

左右两侧各是堆叠的 $N=6$ 层；中间通过 **Encoder-Decoder Attention** 连接。

### 2.1 Encoder（左半边）

每层两个子层：

1. **Multi-Head Self-Attention**
2. **Position-wise Feed-Forward Network（FFN）**

每个子层外包 **残差连接 + LayerNorm**：

$$
\mathrm{LayerNorm}\bigl(x + \mathrm{Sublayer}(x)\bigr)
$$

所有子层与 Embedding 的输出维度统一为 $d_{\mathrm{model}}=512$，以便残差相加。

### 2.2 Decoder（右半边）

每层三个子层：

1. **Masked Multi-Head Self-Attention**（防止看到未来 token）
2. **Encoder-Decoder Multi-Head Attention**（Query 来自 Decoder，Key/Value 来自 Encoder）
3. **Position-wise FFN**

同样是残差 + LayerNorm。Masking + 输出 Embedding 右移一位，保证位置 $i$ 的预测只依赖 $< i$ 的已生成结果（自回归）。

---

## 3. Attention：模型的核心

### 3.1 注意力的一般定义

Attention 把一个 **Query** 和一组 **Key–Value** 映射成输出：

- 用 Query 与各 Key 的「相容性」算权重
- 对 Value 做加权求和

直觉：**Query 在问「我该看谁」；Key 在回答「我是谁」；Value 是「我有什么信息」。**

### 3.2 Scaled Dot-Product Attention

论文采用的具体形式：

$$
\mathrm{Attention}(Q,K,V)=\mathrm{softmax}\!\left(\frac{QK^{T}}{\sqrt{d_k}}\right)V
$$

其中 $Q,K$ 维度为 $d_k$，$V$ 维度为 $d_v$。

**为什么要除以 $\sqrt{d_k}$？**

当 $d_k$ 较大时，点积幅度容易变大（若 $q,k$ 各维独立、均值 0 方差 1，则 $q\cdot k$ 方差为 $d_k$），softmax 会进入梯度极小的饱和区。缩放可以稳住梯度。

对比：

| 类型 | 特点 |
|------|------|
| Additive Attention | 用一层前馈网络算相容性，大 $d_k$ 时更稳，但慢 |
| Dot-Product（无缩放） | 可走高效矩阵乘，但大 $d_k$ 时易饱和 |
| **Scaled Dot-Product** | 保留矩阵乘效率，同时用缩放缓解饱和 |

### 3.3 Multi-Head Attention

不做一次「大维度」注意力，而是把 $Q,K,V$ **线性投影 $h$ 次**，在 $h$ 个低维子空间里并行做 Attention，再拼接并投影回去：

$$
\begin{aligned}
\mathrm{MultiHead}(Q,K,V) &= \mathrm{Concat}(\mathrm{head}_1,\ldots,\mathrm{head}_h)\,W^O \\
\mathrm{head}_i &= \mathrm{Attention}(QW_i^Q,\,KW_i^K,\,VW_i^V)
\end{aligned}
$$

论文设定：$h=8$，$d_k=d_v=d_{\mathrm{model}}/h=64$。

**为什么多头？**

单头会把不同位置的信息「平均」掉；多头让模型在不同子空间关注不同关系（句法、指代、长短距离依赖等）。附录可视化也印证了这一点：有的头学长距依赖，有的头像在做指代消解。

总计算量与「单头全维度」大致相当，因为每个 head 的维度变小了。

### 3.4 模型中三种 Attention 用法

| 位置 | Q 来源 | K/V 来源 | 作用 |
|------|--------|----------|------|
| Encoder Self-Attention | Encoder 上一层 | 同左 | 每个位置看整句，建上下文表示 |
| Decoder Masked Self-Attention | Decoder 上一层 | 同左（带因果 Mask） | 只看已生成部分，保持自回归 |
| Encoder-Decoder Attention | Decoder | Encoder 输出 | Decoder 对齐/读取源语言信息 |

### 3.5 Decoder 的因果 Mask

**问题**：训练时 target 整句一起喂进 Decoder（teacher forcing）。若不加限制，Self-Attention 会看到未来 token，相当于偷看答案。

**做法**：只在 Decoder Self-Attention 里，于 softmax 前把「未来位置」的分数设为 $-\infty$，使其权重变为 0：

$$
\mathrm{Attention}(Q,K,V)=\mathrm{softmax}\!\left(\frac{QK^{T}}{\sqrt{d_k}}+M\right)V
$$

$M$ 为上三角 $-\infty$、下三角（含对角）为 $0$ 的矩阵。例如长度 4：

$$
M=\begin{bmatrix}
0 & -\infty & -\infty & -\infty \\
0 & 0 & -\infty & -\infty \\
0 & 0 & 0 & -\infty \\
0 & 0 & 0 & 0
\end{bmatrix}
$$

即位置 $i$ 只能 attend 到 $\le i$ 的位置。

**与右移配合**：输出 Embedding 右移一位（前面加 BOS），使位置 $i$ 的输入对应预测 $y_i$；Mask 保证并行计算时仍不泄漏未来信息。二者缺一不可。

**作用范围**：Encoder Self-Attention、Encoder-Decoder Attention 都不需要因果 Mask（后者本来就可看全部源句）。实践中另有 Padding Mask，可与因果 Mask 叠加，但用途不同。

---

## 4. 其他关键模块

### 4.1 Position-wise FFN

每个位置独立、共享参数地过同一个两层网络：

$$
\mathrm{FFN}(x)=\max(0,\,xW_1+b_1)W_2+b_2
$$

维度：$d_{\mathrm{model}}=512 \rightarrow d_{ff}=2048 \rightarrow 512$。可理解为 kernel size = 1 的两次卷积。

直觉上：Self-Attention 负责「聚合信息」，FFN 负责「逐位置非线性变换 / 记忆」。

### 4.2 Embeddings 与 Softmax

- Token → $d_{\mathrm{model}}$ 维向量（可学习 Embedding）
- Decoder 输出 → 线性变换 + Softmax → 下一 token 概率
- **输入 Embedding、输出 Embedding、预 Softmax 线性层共享同一权重矩阵**，并在 Embedding 处乘以 $\sqrt{d_{\mathrm{model}}}$

### 4.3 Positional Encoding（位置编码）

没有 RNN / CNN，模型本身不感知顺序。因此在 Encoder / Decoder 底部把位置信息加到 Embedding 上。

论文用正弦/余弦：

$$
\begin{aligned}
PE_{(pos,\,2i)} &= \sin\!\bigl(pos / 10000^{2i/d_{\mathrm{model}}}\bigr) \\
PE_{(pos,\,2i+1)} &= \cos\!\bigl(pos / 10000^{2i/d_{\mathrm{model}}}\bigr)
\end{aligned}
$$

选择理由：

1. 对任意固定偏移 $k$，$PE_{pos+k}$ 可表示为 $PE_{pos}$ 的线性函数，便于学习相对位置。
2. 可能外推到训练时未见过的更长序列。
3. 实验中与可学习位置嵌入效果几乎一样（Table 3 行 E），正弦版更利于外推，故采用。

---

## 5. 为什么用 Self-Attention？（复杂度对比）

论文从三个维度比较 Self-Attention / Recurrent / Convolutional：

| Layer 类型 | 每层复杂度 | 最少串行步数 | 最长路径长度 |
|------------|------------|--------------|--------------|
| Self-Attention | $O(n^2\cdot d)$ | $O(1)$ | $O(1)$ |
| Recurrent | $O(n\cdot d^2)$ | $O(n)$ | $O(n)$ |
| Convolutional | $O(k\cdot n\cdot d^2)$ | $O(1)$ | $O(\log_k n)$（空洞） |
| Restricted Self-Attention | $O(r\cdot n\cdot d)$ | $O(1)$ | $O(n/r)$ |

要点：

- **并行度**：Self-Attention 一次算完全图，串行步数为常数；RNN 必须 $O(n)$ 步。
- **长程依赖**：Self-Attention 任意两位置直接相连，路径 $O(1)$；CNN 要堆层；RNN 路径随距离线性增长。
- **算力**：当 $n < d$ 时（机器翻译里常见：句子不太长，表示维度较大），Self-Attention 往往比 RNN 更划算。超长序列时可用「局部窗口」限制注意力范围。

额外好处：注意力分布本身可解释——附录展示了句法、指代等行为。

---

## 6. 训练设置

### 6.1 数据与硬件

| 项目 | 内容 |
|------|------|
| 英德 | WMT 2014，约 450 万句对，BPE 共享词表约 37K |
| 英法 | WMT 2014，约 3600 万句，WordPiece 词表 32K |
| Batch | 约 25K source tokens + 25K target tokens |
| 硬件 | 1 机 8× NVIDIA P100 |
| Base | 约 0.4s/step，10 万步 ≈ 12 小时 |
| Big | 约 1.0s/step，30 万步 ≈ 3.5 天 |

### 6.2 优化器与学习率

Adam：$\beta_1=0.9,\ \beta_2=0.98,\ \epsilon=10^{-9}$

$$
\mathrm{lrate}=d_{\mathrm{model}}^{-0.5}\cdot\min\!\bigl(\mathrm{step\_num}^{-0.5},\;\mathrm{step\_num}\cdot\mathrm{warmup\_steps}^{-1.5}\bigr)
$$

即先线性 warmup（`warmup_steps=4000`），再按步数平方根倒数衰减。

### 6.3 正则化

1. **Residual Dropout**：$P_{drop}=0.1$（Big 模型部分实验用 0.3），加在子层输出、以及 Embedding+PE 之和上。
2. **Label Smoothing**：$\epsilon_{ls}=0.1$，会略伤困惑度，但提升准确率与 BLEU。

---

## 7. 实验结果

### 7.1 机器翻译（核心结果）

| 模型 | EN→DE BLEU | EN→FR BLEU | 训练代价（量级） |
|------|------------|------------|------------------|
| 当时强基线 / Ensemble | ~26.3 | ~41.3 | 很高 |
| Transformer Base | **27.3** | 38.1 | $3.3\times 10^{18}$ |
| Transformer Big | **28.4** | **41.8** | $2.3\times 10^{19}$ |

- 英德：Big 比此前最佳（含 ensemble）高 **2+ BLEU**。
- 英法：单模型新 SOTA，训练成本约为旧 SOTA 的约 1/4。
- Base 已超过多数旧模型，且更省算力。

推理：Beam size = 4，length penalty $\alpha=0.6$；Base 平均最后 5 个 checkpoint，Big 平均最后 20 个。

### 7.2 消融实验（Table 3 要点）

- **头数**：单头比最佳设置差约 0.9 BLEU；头太多也会掉点。8 头是好折中。
- **$d_k$**：缩小 key 维度会伤质量，说明「相容性」并不简单，点积之外或许还有更强相容函数空间。
- **模型变大**：更深 / 更宽通常更好。
- **Dropout**：对防过拟合很重要。
- **位置编码**：正弦 vs 可学习，效果几乎相同。

### 7.3 英语成分句法分析（泛化能力）

在 Penn Treebank / 半监督设定上，4 层 Transformer（$d_{\mathrm{model}}=1024$）表现接近甚至超过不少专用解析器：

- 仅 WSJ（约 4 万句）：F1 **91.3**
- 半监督：F1 **92.7**

说明架构不只适用于翻译，也能迁移到输出结构约束更强、输出更长的任务。

---

## 8. 推荐记忆的超参（Base / Big）

| 超参 | Base | Big |
|------|------|-----|
| $N$（层数） | 6 | 6 |
| $d_{\mathrm{model}}$ | 512 | 1024 |
| $d_{ff}$ | 2048 | 4096 |
| $h$（头数） | 8 | 16 |
| $d_k=d_v$ | 64 | 64 |
| $P_{drop}$ | 0.1 | 0.3 |
| 参数量 | ~65M | ~213M |

---

## 9. 读后要点与历史影响

### 论文本身的贡献

1. **证明「纯注意力」可以替代 RNN/CNN** 做序列转换。
2. 给出完整可复现配方：Scaled Dot-Product、Multi-Head、正弦 PE、Warmup LR、Label Smoothing 等。
3. 用复杂度与路径长度理论，解释为何 Self-Attention 更适合长程依赖与并行训练。

### 对后续的影响（简要）

- **Encoder-only** → BERT 等双向预训练模型  
- **Decoder-only** → GPT 系列、绝大多数现代 LLM  
- **Encoder-Decoder** → T5、BART、原始机器翻译 Transformer  

今天的大模型在细节上有很多变体（Pre-LN、RoPE、GQA、MoE……），但主干仍是这篇论文奠定的：**注意力 + FFN + 残差 + 归一化**。

### 阅读时容易忽略的细节

- Decoder 的 Mask 与「输出右移一位」共同保证自回归。
- Embedding 与 Softmax 投影权重共享，并乘 $\sqrt{d_{\mathrm{model}}}$。
- Scaling 的动机是数值稳定性，不是「魔法」。
- Multi-Head 的价值在「多子空间」，不只是把计算拆开。

---

## 10. 公式速查

**Scaled Dot-Product Attention**

$$
\mathrm{Attention}(Q,K,V)=\mathrm{softmax}\!\left(\frac{QK^{T}}{\sqrt{d_k}}\right)V
$$

**Multi-Head Attention**

$$
\mathrm{MultiHead}(Q,K,V)=\mathrm{Concat}(\mathrm{head}_1,\ldots,\mathrm{head}_h)W^O
$$

**FFN**

$$
\mathrm{FFN}(x)=\mathrm{ReLU}(xW_1+b_1)W_2+b_2
$$

**正弦位置编码**

$$
PE_{(pos,2i)}=\sin(pos/10000^{2i/d_{\mathrm{model}}}),\quad
PE_{(pos,2i+1)}=\cos(pos/10000^{2i/d_{\mathrm{model}}})
$$

**学习率**

$$
\mathrm{lrate}=d_{\mathrm{model}}^{-0.5}\cdot\min(\mathrm{step}^{-0.5},\;\mathrm{step}\cdot\mathrm{warmup}^{-1.5})
$$

---

## 参考

- Vaswani et al. *Attention Is All You Need*. NeurIPS 2017. [arXiv:1706.03762](https://arxiv.org/abs/1706.03762)
- 官方代码（论文提及）：[tensorflow/tensor2tensor](https://github.com/tensorflow/tensor2tensor)
