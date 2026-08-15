---
title: 2026-08-15 傅里叶变换
type: log
pubDate: 2026-08-15
---

## 1. 概述

傅里叶变换把复杂信号分解为不同频率的分量，让许多时域中难以处理的问题能在频域中被清晰分析，因此是信号处理、通信和物理学的重要工具。

本章依次介绍傅里叶级数、收敛性、傅里叶变换和快速傅里叶变换（FFT）。

## 2. 傅里叶级数

### 2.1 从向量正交到函数正交

数学处理复杂问题的基本方法，是把复杂对象拆成一组简单、彼此独立的分量。向量可以沿正交基分解；傅里叶级数则试图把函数沿一组正交函数分解。

对两个向量 $\boldsymbol{a},\boldsymbol{b}\in\mathbb{R}^n$，内积定义为

$$
\langle\boldsymbol{a},\boldsymbol{b}\rangle
=\sum_{k=1}^{n}a_kb_k
$$

内积为零时，两个向量正交：

$$
\boldsymbol{a}\perp\boldsymbol{b}
\quad\Longleftrightarrow\quad
\langle\boldsymbol{a},\boldsymbol{b}\rangle=0
$$

函数没有有限个固定分量，怎样定义正交？先在 $[a,b]$ 上等距取 $n$ 个点，把函数值看成向量，再计算带有间隔 $\Delta x$ 的离散内积：

![从函数采样到连续函数内积](/diagrams/fourier-transform/function-inner-product-sampling.drawio.svg)

$$
\langle f,g\rangle_n
=\sum_{k=1}^{n}f(x_k)g(x_k)\,\Delta x,
\qquad
\Delta x=\frac{b-a}{n}
$$

当采样点无限加密，这个黎曼和趋近积分：

$$
\langle f,g\rangle
=\lim_{n\to\infty}\langle f,g\rangle_n
=\int_a^b f(x)g(x)\,dx
$$

因此，实函数在 $[a,b]$ 上正交，当且仅当

$$
\int_a^b f(x)g(x)\,dx=0
$$

直观上，积分为零表示 $f(x)g(x)$ 的正负贡献整体抵消，而不是两条函数曲线处处互不相交。

### 2.2 正弦、余弦函数的正交性

任意向量 $\boldsymbol{v}\in\mathbb{R}^n$ 都能沿 $n$ 个单位向量分解：

$$
\boldsymbol{v}=v_1\boldsymbol{e}_1+v_2\boldsymbol{e}_2+\cdots+v_n\boldsymbol{e}_n
$$

自然要问：函数能否也拆成多个甚至无穷多个两两正交函数之和？一般情形涉及函数空间与收敛性。先把问题限制为：能否用正弦和余弦表示一个周期为 $2\pi$ 的函数？

对 $m,n\ge 1$，在一个完整周期 $[-\pi,\pi]$ 上定义内积

$$
\langle f,g\rangle=\int_{-\pi}^{\pi}f(x)g(x)\,dx
$$

利用积化和差公式：

$$
\begin{aligned}
\cos(mx)\cos(nx)
&=\frac{1}{2}\left[\cos((m-n)x)+\cos((m+n)x)\right],\\
\sin(mx)\sin(nx)
&=\frac{1}{2}\left[\cos((m-n)x)-\cos((m+n)x)\right],\\
\sin(mx)\cos(nx)
&=\frac{1}{2}\left[\sin((m+n)x)+\sin((m-n)x)\right].
\end{aligned}
$$

非零整数频率的正弦、余弦在完整周期上的积分都为零，因此

$$
\int_{-\pi}^{\pi}\cos(mx)\cos(nx)\,dx
=
\begin{cases}
0, & m\ne n,\\
\pi, & m=n,
\end{cases}
$$

$$
\int_{-\pi}^{\pi}\sin(mx)\sin(nx)\,dx
=
\begin{cases}
0, & m\ne n,\\
\pi, & m=n,
\end{cases}
$$

并且

$$
\int_{-\pi}^{\pi}\sin(mx)\cos(nx)\,dx=0
$$

常数函数 $1$ 也与所有 $\sin(nx)$、$\cos(nx)$ 正交。于是

$$
1,\ \cos x,\ \sin x,\ \cos 2x,\ \sin 2x,\ \ldots
$$

构成一组两两正交的函数。

### 2.3 傅里叶级数的定义

设 $f$ 是以 $2\pi$ 为周期的函数，它的傅里叶级数写作

$$
f(x)\sim\frac{a_0}{2}
+\sum_{k=1}^{\infty}\left[a_k\cos(kx)+b_k\sin(kx)\right]
$$

下面利用正弦、余弦函数的正交性求出系数。先取 $k\ge1$，对级数两边同乘 $\cos(kx)$，并在 $[-\pi,\pi]$ 上积分：

$$
\int_{-\pi}^{\pi}f(x)\cos(kx)\,dx
=\int_{-\pi}^{\pi}
\left\{
\frac{a_0}{2}
+\sum_{n=1}^{\infty}
\left[a_n\cos(nx)+b_n\sin(nx)\right]
\right\}\cos(kx)\,dx
$$

右侧除 $a_k\cos(kx)$ 外，其余项积分都为零，因此

$$
\int_{-\pi}^{\pi}f(x)\cos(kx)\,dx
=a_k\int_{-\pi}^{\pi}\cos^2(kx)\,dx
=\pi a_k
$$

所以

$$
a_k=\frac{1}{\pi}\int_{-\pi}^{\pi}f(x)\cos(kx)\,dx,
\qquad k\ge1
$$

同理，两边同乘 $\sin(kx)$ 后积分，只有 $b_k\sin(kx)$ 被保留下来：

$$
\int_{-\pi}^{\pi}f(x)\sin(kx)\,dx
=b_k\int_{-\pi}^{\pi}\sin^2(kx)\,dx
=\pi b_k
$$

因此

$$
b_k=\frac{1}{\pi}\int_{-\pi}^{\pi}f(x)\sin(kx)\,dx,
\qquad k\ge1
$$

最后，直接对级数两边积分，所有正弦、余弦项都为零：

$$
\int_{-\pi}^{\pi}f(x)\,dx
=\frac{a_0}{2}\int_{-\pi}^{\pi}1\,dx
=\pi a_0
$$

因此，余弦系数可以统一写成

$$
a_k=\frac{1}{\pi}\int_{-\pi}^{\pi}f(x)\cos(kx)\,dx,
\qquad k=0,1,2,\ldots
$$

这里使用 $\sim$ 而不是等号，因为傅里叶级数是否收敛、收敛到什么函数，还需要单独讨论。

## 3. 傅里叶级数的收敛性

### 3.1 傅里叶级数等于原函数吗

傅里叶系数的计算只说明一个必要结论：**如果 $f(x)$ 能被这组正弦、余弦函数表示，那么系数只能这样取。**

但把这些系数代回级数后，得到的无穷和是否真的等于原函数？令前 $N$ 项的部分和为

$$
S_n(x)=\frac{a_0}{2}
+\sum_{k=1}^{n}\left[a_k\cos(kx)+b_k\sin(kx)\right]
$$

真正需要回答的问题是

$$
\lim_{n\to\infty}S_n(x)\stackrel{?}{=}f(x)
$$

这个极限是否存在、何时等于 $f(x)$，以及函数不连续时会收敛到哪里，就是傅里叶级数的收敛性问题。

### 3.2 狄利克雷积分

傅里叶级数的第 $n$ 个部分和定义为

$$
S_n(x)=\frac{a_0}{2}
+\sum_{k=1}^{n}\left[a_k\cos(kx)+b_k\sin(kx)\right]
$$

将 $a_0$、$a_k$、$b_k$ 的积分表达式直接代入，并使用余弦求和公式（见附录）：

$$
\begin{aligned}
S_n(x)
&=\frac{1}{\pi}\int_{-\pi}^{\pi}f(t)
\left\{\frac12+\sum_{k=1}^{n}
\left[\cos(kx)\cos(kt)+\sin(kx)\sin(kt)\right]\right\}dt\\
&=\frac{1}{\pi}\int_{-\pi}^{\pi}
f(t)\left[\frac12+\sum_{k=1}^{n}\cos k(x-t)\right]dt\\
&=\frac{1}{\pi}\int_{-\pi}^{\pi}f(t)
\frac{\sin\left[\left(n+\frac12\right)(x-t)\right]}
{2\sin\frac{x-t}{2}}\,dt
\end{aligned}
$$

令 $u=t-x$。由于变量替换后的被积函数以 $2\pi$ 为周期，积分区间可以移回 $[-\pi,\pi]$：

$$
S_n(x)=\frac{1}{\pi}\int_{-\pi}^{\pi}
f(x+u)
\frac{\sin\left[\left(n+\frac12\right)u\right]}
{2\sin\frac{u}{2}}\,du
$$

再把积分拆成 $[-\pi,0]$ 和 $[0,\pi]$，并在前一段令 $u\mapsto-u$：

$$
\begin{aligned}
S_n(x)
&=\frac{1}{\pi}\int_{-\pi}^{0}
f(x+u)\frac{\sin\left[\left(n+\frac12\right)u\right]}
{2\sin\frac{u}{2}}\,du\\
&\quad+\frac{1}{\pi}\int_{0}^{\pi}
f(x+u)\frac{\sin\left[\left(n+\frac12\right)u\right]}
{2\sin\frac{u}{2}}\,du\\
&=\frac{1}{\pi}\int_{0}^{\pi}
\left[f(x-u)+f(x+u)\right]
\frac{\sin\left[\left(n+\frac12\right)u\right]}
{2\sin\frac{u}{2}}\,du
\end{aligned}
$$

最后定义狄利克雷核

$$
D_n(u)=\frac{\sin\left[\left(n+\frac12\right)u\right]}
{2\sin\frac{u}{2}}
$$

傅里叶部分和便写成

$$
S_n(x)=\frac{1}{\pi}\int_{0}^{\pi}
\left[f(x-u)+f(x+u)\right]D_n(u)\,du
$$

这就是傅里叶部分和的狄利克雷积分表示。

先做一个直观分析。固定 $\delta\in(0,\pi)$，考察远离 $u=0$ 的部分：

$$
\frac{1}{\pi}\int_{\delta}^{\pi}
\frac{f(x-u)+f(x+u)}{2\sin\frac{u}{2}}
\sin\left[\left(n+\frac12\right)u\right]du
$$

当 $n\to\infty$ 时，正弦项振荡得越来越快；而在 $[\delta,\pi]$ 上，分母不会趋近于零。正负振荡相互抵消，因此在通常的正则条件下，这部分积分趋近于 $0$。所以 $S_n(x)$ 的极限主要由 $u=0$ 附近决定。

### 3.3 黎曼—勒贝格引理

上面的“快速振荡相互抵消”可以由黎曼—勒贝格引理严格说明。

若 $g$ 在 $[a,b]$ 上分段连续，则

$$
\lim_{\lambda\to\infty}\int_a^b g(u)\sin(\lambda u)\,du=0,
\qquad
\lim_{\lambda\to\infty}\int_a^b g(u)\cos(\lambda u)\,du=0
$$

下面证明正弦的情形。任取 $\varepsilon>0$，把积分区间分成有限段：

$$
a=x_0<x_1<\cdots<x_m=b
$$

由于 $g$ 分段连续，可以在每个区间 $[x_{j-1},x_j]$ 上选一个常数 $c_j$，使这些常数构成的阶梯函数与 $g$ 足够接近：

$$
\sum_{j=1}^{m}\int_{x_{j-1}}^{x_j}|g(u)-c_j|\,du<\varepsilon
$$

将积分分段，并在每一段中加减 $c_j$：

$$
\begin{aligned}
\int_a^b g(u)\sin(\lambda u)\,du
&=\sum_{j=1}^{m}\int_{x_{j-1}}^{x_j}
[g(u)-c_j]\sin(\lambda u)\,du\\
&\quad+\sum_{j=1}^{m}c_j\int_{x_{j-1}}^{x_j}
\sin(\lambda u)\,du
\end{aligned}
$$

第一部分的绝对值小于 $\varepsilon$。第二部分满足

$$
\begin{aligned}
\left|\sum_{j=1}^{m}c_j\int_{x_{j-1}}^{x_j}
\sin(\lambda u)\,du\right|
&=\left|\sum_{j=1}^{m}c_j
\frac{\cos(\lambda x_{j-1})-\cos(\lambda x_j)}{\lambda}\right|\\
&\le\frac{2}{\lambda}\sum_{j=1}^{m}|c_j|
\longrightarrow0
\end{aligned}
$$

因此

$$
\limsup_{\lambda\to\infty}
\left|\int_a^b g(u)\sin(\lambda u)\,du\right|
\le\varepsilon
$$

由于 $\varepsilon$ 可以任意小，正弦情形得证；余弦情形同理。

回到 3.2，在 $[\delta,\pi]$ 上令

$$
g(u)=\frac{f(x-u)+f(x+u)}{2\sin\frac{u}{2}},
\qquad \lambda=n+\frac12
$$

若 $f$ 分段连续，则 $g$ 在该区间上分段连续。由黎曼—勒贝格引理，$[\delta,\pi]$ 上的积分确实趋近于 $0$。

### 3.4 黎曼局部化定理

考察傅里叶级数在 $x_0$ 处收敛到 $S_0$ 的情况，即

$$
S_n(x_0)\longrightarrow S_0
$$

为此计算 $S_n(x_0)-S_0$。由

$$
\int_0^\pi D_n(t)\,dt=\frac{\pi}{2}
$$

可得

$$
S_n(x_0)-S_0
=\frac{1}{\pi}\int_0^\pi
[f(x_0+t)+f(x_0-t)-2S_0]D_n(t)\,dt
$$

固定一个充分小的 $\delta>0$，将积分拆成

$$
\int_0^\pi=\int_0^\delta+\int_\delta^\pi
$$

由黎曼—勒贝格引理，$[\delta,\pi]$ 上的积分趋近于 $0$。因此只需考察

$$
\frac{1}{\pi}\int_0^\delta
[f(x_0+t)+f(x_0-t)-2S_0]
\frac{\sin\left[\left(n+\frac12\right)t\right]}
{2\sin\frac{t}{2}}\,dt
$$

当 $t\to0$ 时，

$$
2\sin\frac{t}{2}\sim t
$$

因此，局部积分的核心形式为

$$
S_n(x_0)-S_0\approx\frac{1}{\pi}\int_0^\delta
\frac{f(x_0+t)+f(x_0-t)-2S_0}{t}
\sin\left[\left(n+\frac12\right)t\right]dt
$$

右侧已经写成“函数 $\times$ 快速振荡的正弦项”的形式，不再含有 $\sin(t/2)$ 分母。它只取决于 $f$ 在 $x_0$ 附近的变化，这就是黎曼局部化定理。

### 3.5 傅里叶级数收敛判别法

由 3.4，傅里叶级数在 $x_0$ 处收敛到 $S_0$ 的充分必要条件是

$$
\lim_{n\to\infty}\int_0^\delta
\frac{f(x_0+t)+f(x_0-t)-2S_0}{t}
\sin\left[\left(n+\frac12\right)t\right]dt=0
$$

令

$$
S_0=\frac{S_1+S_2}{2}
$$

则上面的积分可以拆成

$$
\begin{aligned}
I_n^+
&=\int_0^\delta\frac{f(x_0+t)-S_1}{t}
\sin\left[\left(n+\frac12\right)t\right]dt,\\
I_n^-
&=\int_0^\delta\frac{f(x_0-t)-S_2}{t}
\sin\left[\left(n+\frac12\right)t\right]dt
\end{aligned}
$$

只要 $I_n^+\to0$ 且 $I_n^-\to0$，就有 $S_n(x_0)\to S_0$。

先看最简单的情况。若 $f$ 在 $x_0$ 处可导，取

$$
S_1=S_2=f(x_0)
$$

则

$$
\lim_{t\to0^+}\frac{f(x_0+t)-S_1}{t}=f'(x_0),
\qquad
\lim_{t\to0^+}\frac{f(x_0-t)-S_2}{t}=-f'(x_0)
$$

对于分段可微函数，这两个差商在 $[0,\delta]$ 上分段连续，并可在 $t=0$ 处补成有限值。由黎曼—勒贝格引理，$I_n^+\to0$、$I_n^-\to0$，所以傅里叶级数收敛到 $f(x_0)$。

进一步，若 $f$ 在 $x_0$ 处不连续，但左右极限和左右导数存在，取

$$
S_1=f(x_0+0),
\qquad
S_2=f(x_0-0)
$$

则

$$
\lim_{t\to0^+}\frac{f(x_0+t)-S_1}{t}=f'_+(x_0),
\qquad
\lim_{t\to0^+}\frac{f(x_0-t)-S_2}{t}=-f'_-(x_0)
$$

同理，两个积分分别趋近于 $0$，傅里叶级数收敛到

$$
S_0=\frac{f(x_0-0)+f(x_0+0)}{2}
$$

#### 狄尼定理

若存在 $\delta>0$，使

$$
\int_0^\delta
\left|\frac{f(x_0+t)+f(x_0-t)-2S_0}{t}\right|dt<\infty
$$

则傅里叶级数在 $x_0$ 处收敛到 $S_0$。证明思路很直接：绝对可积条件保证括号中的函数可应用黎曼—勒贝格引理。

#### 李普希茨定理

若存在 $\alpha>0$、$C>0$，使得在 $t\to0^+$ 时

$$
|f(x_0+t)-S_1|\le Ct^\alpha,
\qquad
|f(x_0-t)-S_2|\le Ct^\alpha
$$

则傅里叶级数在 $x_0$ 处收敛到 $S_0=(S_1+S_2)/2$。因为相应的差商至多为 $Ct^{\alpha-1}$，而 $\alpha>0$ 时它在 $0$ 附近可积，所以满足狄尼定理。

#### 狄利克雷定理

若 $f$ 在 $x$ 左右的某个邻域内分别单调，且左右极限存在，则其傅里叶级数在 $x$ 处收敛到

$$
\frac{f(x-0)+f(x+0)}{2}
$$

在连续点，该值就是 $f(x)$；在跳跃间断点，该值是左右极限的平均值。证明可对左右两侧分别使用积分第二中值定理和狄利克雷判别法。

因此，若一个 $2\pi$ 周期函数在一个周期内分段单调，则它的傅里叶级数在每一点都收敛到上述左右极限的平均值。

## 4. 傅里叶变换

### 4.1 从周期 $2\pi$ 推广到周期 $T$

由欧拉公式（见附录 A.4），

$$
e^{ikx}=\cos(kx)+i\sin(kx)
$$

正弦、余弦可以合并为复指数。周期为 $2\pi$ 的傅里叶级数写成

$$
f(x)\sim\sum_{k=-\infty}^{\infty}c_ke^{ikx}
$$

利用复指数的正交性可得

$$
c_k=\frac{1}{2\pi}\int_{-\pi}^{\pi}f(t)e^{-ikt}\,dt,
\qquad k\in\mathbb Z
$$

现在设 $f$ 的周期为 $T$，并记

$$
\omega=\frac{2\pi}{T}
$$

将 $2\pi$ 周期中的 $e^{ikx}$ 缩放为 $e^{ik\omega x}$，得到

$$
f(x)\sim\sum_{k=-\infty}^{\infty}c_ke^{ik\omega x}
$$

系数为

$$
c_k=\frac{1}{T}\int_{-T/2}^{T/2}
f(t)e^{-ik\omega t}\,dt,
\qquad k\in\mathbb Z
$$

相邻频率 $k\omega$ 的间隔为

$$
\Delta\omega=\omega=\frac{2\pi}{T}
$$

当 $T$ 增大时，离散频率仍覆盖正、负整个频率轴，但相邻频率之间越来越密。

### 4.2 当 $T\to\infty$

对定义在整个实数轴上的函数 $f$，先取 $[-T/2,T/2]$ 上的部分，并将它以 $T$ 为周期延拓。记

$$
\Delta\omega=\frac{2\pi}{T},
\qquad
\omega_k=k\Delta\omega
$$

定义

$$
F_T(\omega_k)=\int_{-T/2}^{T/2}f(t)e^{-i\omega_k t}\,dt
$$

由于 $1/T=\Delta\omega/(2\pi)$，傅里叶系数为

$$
c_k=\frac{\Delta\omega}{2\pi}F_T(\omega_k)
$$

代回傅里叶级数：

$$
f(x)=\frac{1}{2\pi}
\sum_{k=-\infty}^{\infty}
F_T(\omega_k)e^{i\omega_kx}\Delta\omega
$$

当 $T\to\infty$ 时，

$$
\Delta\omega=\frac{2\pi}{T}\to0
$$

同时，时间积分区间扩展到整个实数轴：

$$
F(\omega)=\int_{-\infty}^{\infty}f(t)e^{-i\omega t}\,dt
$$

频率网格的黎曼和变成积分：

$$
\sum_{k=-\infty}^{\infty}
F_T(\omega_k)e^{i\omega_kx}\Delta\omega
\longrightarrow
\int_{-\infty}^{\infty}F(\omega)e^{i\omega x}\,d\omega
$$

这说明离散的复指数展开在 $T\to\infty$ 时变成了连续频率上的积分。

### 4.3 傅里叶变换的定义

函数 $f(x)$ 的傅里叶变换定义为

$$
F(\omega)=\int_{-\infty}^{\infty}f(x)e^{-i\omega x}\,dx
$$

$F(\omega)$ 描述 $f$ 在角频率 $\omega$ 上的复振幅。

傅里叶逆变换定义为

$$
f(x)=\frac{1}{2\pi}\int_{-\infty}^{\infty}
F(\omega)e^{i\omega x}\,d\omega
$$

正变换把函数分解为不同频率的复指数，逆变换再把这些频率成分叠加回原函数。本文把系数 $1/(2\pi)$ 放在逆变换中；其他资料可能采用不同的系数分配方式。

## 5. 离散傅里叶变换与快速傅里叶变换（DFT/FFT）

### 5.1 多项式乘法

设两个多项式各有 $n$ 个系数：

$$
A(x)=\sum_{j=0}^{n-1}a_jx^j,
\qquad
B(x)=\sum_{j=0}^{n-1}b_jx^j
$$

直接展开 $C(x)=A(x)B(x)$，每个 $a_i$ 都要与每个 $b_j$ 相乘，因此时间复杂度为

$$
O(n^2)
$$

换一种思路：不直接计算乘积的系数，而是先计算多项式在一些点上的值。

一个含有 $n$ 个系数的多项式，次数不超过 $n-1$。任取 $n$ 个不同的点 $x_0,x_1,\ldots,x_{n-1}$，已知这些点上的值，就能唯一确定全部系数：

$$
\begin{bmatrix}
1&x_0&x_0^2&\cdots&x_0^{n-1}\\
1&x_1&x_1^2&\cdots&x_1^{n-1}\\
\vdots&\vdots&\vdots&&\vdots\\
1&x_{n-1}&x_{n-1}^2&\cdots&x_{n-1}^{n-1}
\end{bmatrix}
\begin{bmatrix}
a_0\\a_1\\\vdots\\a_{n-1}
\end{bmatrix}
=
\begin{bmatrix}
A(x_0)\\A(x_1)\\\vdots\\A(x_{n-1})
\end{bmatrix}
$$

左侧是范德蒙德矩阵，其行列式为

$$
\prod_{0\le i<j\le n-1}(x_j-x_i)
$$

只要各点互不相同，行列式就不为 $0$，方程组有唯一解。若这些点是递增排列的实数，行列式进一步大于 $0$。

现在任取 $2n$ 个不同的点 $z_0,z_1,\ldots,z_{2n-1}$，分别计算

$$
A(z_k),\qquad B(z_k)
$$

乘积多项式在这些点上的值可以直接得到：

$$
C(z_k)=A(z_k)B(z_k),
\qquad k=0,1,\ldots,2n-1
$$

$C(x)$ 的次数最多为 $2n-2$。严格来说，$2n-1$ 个不同点已经足够；这里取 $2n$ 个点，是为了后面选择适合快速计算的点数。多项式乘法便变成三步：

$$
\text{系数}
\longrightarrow
\text{在 }2n\text{ 个点上的取值}
\longrightarrow
\text{逐点相乘}
\longrightarrow
\text{恢复乘积系数}
$$

任取不同点虽然能完成计算，但普通的求值和插值仍需要 $O(n^2)$。降低复杂度的关键，是选择一组能够快速求值和插值的特殊点。

### 5.3 离散傅里叶变换

离散傅里叶变换在一组特殊的复数点上计算多项式的值，逆变换再由这些值恢复系数。多项式乘法因此可以转化为取值之间的逐点相乘。

#### 5.3.1 从系数到取值

设

$$
A(x)=\sum_{j=0}^{n-1}a_jx^j
$$

在单位圆上等间隔选取 $n$ 个点：

$$
\omega_k=e^{-\frac{2\pi i k}{n}},
\qquad k=0,1,\ldots,n-1
$$

把多项式代入这些点，得到

$$
X_k=A(\omega_k)
=\sum_{j=0}^{n-1}a_j\omega_k^j
$$

这就是离散傅里叶变换（DFT）。它把系数向量 $\boldsymbol a$ 变成取值向量 $\boldsymbol X$：

$$
\boldsymbol X=F_n\boldsymbol a
$$

其中

$$
F_n=
\begin{bmatrix}
\omega_0^0&\omega_0^1&\cdots&\omega_0^{n-1}\\[0.6em]
\omega_1^0&\omega_1^1&\cdots&\omega_1^{n-1}\\[0.6em]
\vdots&\vdots&&\vdots\\[0.6em]
\omega_{n-1}^0&\omega_{n-1}^1&\cdots&\omega_{n-1}^{n-1}
\end{bmatrix}
$$

#### 5.3.2 从取值回到系数

逐点相乘之后，还要从取值恢复多项式系数，也就是求 $F_n$ 的逆矩阵。为此先介绍复数的共轭。

对于 $z=a+bi$，它的共轭复数为

$$
\bar z=a-bi
$$

也就是说，实部 $a$ 保持不变，虚部 $bi$ 的符号取反。

由 $\omega_k=e^{-2\pi ik/n}$ 可得

$$
\bar{\omega}_k=e^{\frac{2\pi i k}{n}}
$$

对于矩阵 $M=(m_{ij})$，先转置，再对每个元素取共轭，得到共轭转置矩阵 $M^*$：

$$
(M^*)_{ij}=\bar m_{ji}
$$

因此 $F_n$ 的共轭转置为

$$
F_n^*=
\begin{bmatrix}
\bar{\omega}_0^0&\bar{\omega}_1^0&\cdots&\bar{\omega}_{n-1}^0\\[0.6em]
\bar{\omega}_0^1&\bar{\omega}_1^1&\cdots&\bar{\omega}_{n-1}^1\\[0.6em]
\vdots&\vdots&&\vdots\\[0.6em]
\bar{\omega}_0^{n-1}&\bar{\omega}_1^{n-1}&\cdots&\bar{\omega}_{n-1}^{n-1}
\end{bmatrix}
$$

考察 $F_n^*F_n$ 的第 $i$ 行、第 $j$ 列：

$$
\begin{aligned}
(F_n^*F_n)_{ij}
&=\sum_{k=0}^{n-1}\bar{\omega}_k^i\omega_k^j\\
&=\sum_{k=0}^{n-1}e^{-\frac{2\pi i k(j-i)}n}
\end{aligned}
$$

当 $i=j$ 时，每一项都是 $1$，和为 $n$。当 $i\ne j$ 时，这是公比不为 $1$、但其 $n$ 次方为 $1$ 的等比数列，和为 $0$。因此

$$
F_n^*F_n=nI
$$

从而

$$
F_n^{-1}=\frac1nF_n^*
$$

所以逆离散傅里叶变换为

$$
a_j=\frac1n\sum_{k=0}^{n-1}X_k\bar{\omega}_k^j
$$

#### 5.3.3 用 DFT 完成多项式乘法

设 $n=2^r$，两个多项式各有 $n/2$ 个系数：

$$
A(x)=\sum_{j=0}^{n/2-1}a_jx^j,
\qquad
B(x)=\sum_{j=0}^{n/2-1}b_jx^j
$$

乘积 $C(x)=A(x)B(x)$ 的次数最多为 $n-2$，因此 $n$ 个取值足以确定它：

1. **取点：**选取 $\omega_k=e^{-2\pi ik/n}$，$k=0,1,\ldots,n-1$。

2. **求值：**计算 $A_k=A(\omega_k)$ 和 $B_k=B(\omega_k)$。

3. **逐点相乘：**计算 $C_k=A_kB_k$。

4. **逆变换：**计算

   $$
   c_j=\frac1n\sum_{k=0}^{n-1}C_k\bar{\omega}_k^j
   $$

   得到 $C(x)$ 的全部系数。

DFT 定义了系数与取值之间的变换；FFT 是计算这一变换的快速算法。

### 5.4 快速傅里叶变换

快速傅里叶变换（FFT）不是新的变换，而是利用单位根的对称性快速计算 DFT。最基本的是基-2 FFT，设 $n=2^r$。

#### 5.4.1 拆分奇偶系数

偶函数与奇函数分别满足

$$
f(-x)=f(x),
\qquad
g(-x)=-g(x)
$$

一般多项式可以按偶数次项和奇数次项拆开：

$$
A(x)=E(x^2)+xO(x^2)
$$

其中

$$
\begin{aligned}
E(y)&=a_0+a_2y+a_4y^2+\cdots,\\
O(y)&=a_1+a_3y+a_5y^2+\cdots
\end{aligned}
$$

$E$ 和 $O$ 各有 $n/2$ 个系数。对于一对取值点 $x$ 与 $-x$，有

$$
\begin{aligned}
A(x)&=E(x^2)+xO(x^2),\\
A(-x)&=E(x^2)-xO(x^2)
\end{aligned}
$$

因此，只需求出 $E(x^2)$ 和 $O(x^2)$，就能同时得到 $A(x)$ 与 $A(-x)$。一个规模为 $n$ 的 DFT 由此被拆成两个规模为 $n/2$ 的 DFT。

#### 5.4.2 合并两个子问题

对于 $k=0,1,\ldots,n/2-1$，单位根满足

$$
\omega_{k+n/2}=-\omega_k,
\qquad
\omega_{k+n/2}^2=\omega_k^2
$$

而

$$
\omega_k^2=e^{-\frac{2\pi ik}{n/2}}
$$

正好是规模为 $n/2$ 的 DFT 所使用的取值点。记两个子问题的结果为

$$
E_k=E(\omega_k^2),
\qquad
O_k=O(\omega_k^2)
$$

则前一半取值为

$$
X_k=A(\omega_k)=E_k+\omega_kO_k
$$

后一半取值为

$$
\begin{aligned}
X_{k+n/2}
&=A(\omega_{k+n/2})\\
&=E_k-\omega_kO_k
\end{aligned}
$$

因此，同一组 $E_k$、$O_k$ 经过一次加法和一次减法，就能同时得到 $X_k$ 与 $X_{k+n/2}$。这一步称为蝶形合并：

$$
\begin{aligned}
X_k&=E_k+\omega_kO_k,\\
X_{k+n/2}&=E_k-\omega_kO_k
\end{aligned}
$$

#### 5.4.3 逆快速傅里叶变换

逆变换为

$$
a_j=\frac1n\sum_{k=0}^{n-1}X_k\bar{\omega}_k^j
$$

与正向 FFT 相比，只需将 $\omega_k$ 换成 $\bar{\omega}_k$，拆分和合并过程不变，最后再除以 $n$。

#### 5.4.4 递归与时间复杂度

两个规模为 $n/2$ 的子问题继续按照相同方式拆分，直到只剩一个系数。计算过程形成一棵递归树：

$$
n
\longrightarrow
2\times\frac n2
\longrightarrow
4\times\frac n4
\longrightarrow\cdots\longrightarrow
n\times1
$$

每一层共有 $n$ 个数据，合并需要 $O(n)$ 次运算；从 $n$ 递归到 $1$ 共有 $\log_2n$ 层。因此

$$
T(n)=2T\left(\frac n2\right)+O(n)
=O(n\log n)
$$

多项式乘法包含两次 DFT、一次逆 DFT 和一次逐点相乘，总复杂度为

$$
O(n\log n)
$$

### 5.5 FFT 代码实现

练习题：[洛谷 P3803：多项式乘法（加强版）](https://www.luogu.com.cn/problem/P3803#ide)。

#### 5.5.1 长度补齐

设两个多项式的次数分别为 $n$ 和 $m$，乘积共有 $n+m+1$ 个系数。基-2 FFT 要求取值点数是 $2$ 的整数次幂，因此取

$$
N=2^{\lceil\log_2(n+m+1)\rceil}
$$

再将两个系数数组统一补零到长度 $N$。$n$ 和 $m$ 本身不需要是 $2$ 的整数次幂，只要 $N\ge n+m+1$ 即可。

#### 5.5.2 代码

代码依赖 `<cmath>`、`<complex>` 和 `<vector>`。`sign=-1` 表示 DFT，`sign=1` 表示逆 DFT 所需的共轭方向。

```cpp
using namespace std;

vector<complex<double>> fft(
    const vector<complex<double>>& A,
    int sign = -1) {
  const int n = static_cast<int>(A.size());
  if (n == 1) {
    return A;
  }

  // 将 A 拆成偶数次项 E 和奇数次项 O。
  vector<complex<double>> evenA(n / 2);
  vector<complex<double>> oddA(n / 2);
  for (int i = 0; i < n / 2; ++i) {
    evenA[i] = A[2 * i];
    oddA[i] = A[2 * i + 1];
  }

  const auto E = fft(evenA, sign);
  const auto O = fft(oddA, sign);

  // w = exp(sign * 2πi / n)，wk = w^k = exp(sign * 2πik / n)。
  // 不在循环中调用 pow(w, k)：按快速幂计算时单次为 O(log k)，
  // 用 wk *= w 递推只需 O(1)。
  const double pi = acos(-1.0);
  const complex<double> w = exp(
      complex<double>(0, sign * 2.0 * pi / n));
  complex<double> wk = 1.0;

  // X[k] = E[k] + wk * O[k]，X[k + n/2] = E[k] - wk * O[k]。
  vector<complex<double>> X(n);
  for (int k = 0; k < n / 2; ++k) {
    X[k] = E[k] + wk * O[k];
    X[k + n / 2] = E[k] - wk * O[k];
    wk *= w;
  }

  return X;
}

vector<complex<double>> ifft(
    const vector<complex<double>>& X) {
  vector<complex<double>> A = fft(X, 1);
  const int n = static_cast<int>(X.size());
  for (auto& coefficient : A) {
    coefficient /= n;
  }
  return A;
}

vector<long long> multiply(
    const vector<long long>& A,
    const vector<long long>& B) {
  const int resultSize =
      static_cast<int>(A.size() + B.size() - 1);

  // 两个多项式统一补零到不小于结果长度的最小 2 次幂。
  int N = 1;
  while (N < resultSize) {
    N <<= 1;
  }

  vector<complex<double>> paddedA(N, 0.0);
  vector<complex<double>> paddedB(N, 0.0);
  for (int i = 0; i < static_cast<int>(A.size()); ++i) {
    paddedA[i] = A[i];
  }
  for (int i = 0; i < static_cast<int>(B.size()); ++i) {
    paddedB[i] = B[i];
  }

  const auto valueA = fft(paddedA);
  const auto valueB = fft(paddedB);

  // C(w_k) = A(w_k)B(w_k)。
  vector<complex<double>> valueC(N);
  for (int k = 0; k < N; ++k) {
    valueC[k] = valueA[k] * valueB[k];
  }

  const auto coefficientsC = ifft(valueC);
  vector<long long> C(resultSize);
  for (int i = 0; i < resultSize; ++i) {
    // 消除浮点计算产生的微小误差。
    C[i] = llround(coefficientsC[i].real());
  }

  return C;
}
```

## 附录

### A.1 余弦求和公式

令

$$
C_n(u)=\cos u+\cos 2u+\cdots+\cos nu
=\sum_{k=1}^{n}\cos(ku)
$$

利用恒等式

$$
2\sin\frac{u}{2}\cos(ku)
=\sin\left[\left(k+\frac12\right)u\right]
-\sin\left[\left(k-\frac12\right)u\right]
$$

对 $k=1,2,\ldots,n$ 求和，中间项依次抵消：

$$
2\sin\frac{u}{2}C_n(u)
=\sin\left[\left(n+\frac12\right)u\right]-\sin\frac{u}{2}
$$

所以

$$
C_n(u)
=\frac{\sin\left[\left(n+\frac12\right)u\right]}
{2\sin\frac{u}{2}}-\frac12
$$

加上 $\frac12$，得到

$$
\frac12+\sum_{k=1}^{n}\cos(ku)
=\frac{\sin\left[\left(n+\frac12\right)u\right]}
{2\sin\frac{u}{2}}
$$

当 $u=2m\pi$ 时，上式按极限取值 $n+\frac12$。

### A.2 黎曼积分的定义

将闭区间 $[a,b]$ 分成若干小区间：

$$
a=x_0<x_1<\cdots<x_n=b
$$

在每个 $[x_{i-1},x_i]$ 中任取一点 $\xi_i$，构造黎曼和

$$
\sum_{i=1}^{n}f(\xi_i)(x_i-x_{i-1})
$$

记最长的小区间长度为

$$
\|P\|=\max_{1\le i\le n}(x_i-x_{i-1})
$$

如果无论怎样分割、怎样选择 $\xi_i$，当 $\|P\|\to0$ 时，黎曼和都趋近于同一个数 $I$，就称 $f$ 在 $[a,b]$ 上黎曼可积，并定义

$$
\int_a^b f(x)\,dx=I
$$

每一项是一个小矩形的面积；黎曼积分就是这些面积在分割无限变细时的极限。

### A.3 泰勒展开

泰勒多项式用函数在 $x_0$ 处的各阶导数构造多项式，使两者在该点具有相同的值、斜率、曲率以及更高阶变化：

$$
\begin{aligned}
f(x)
&=f(x_0)+f'(x_0)(x-x_0)
+\frac{f''(x_0)}{2!}(x-x_0)^2+\cdots\\
&\quad+\frac{f^{(n)}(x_0)}{n!}(x-x_0)^n+R_n(x)
\end{aligned}
$$

有限阶多项式通常只在 $x_0$ 附近近似 $f$。只有当

$$
R_n(x)\to0
$$

时，才能令 $n\to\infty$，用无穷级数精确表示函数。

当 $x_0=0$ 时，上式称为麦克劳林展开：

$$
f(x)=\sum_{k=0}^{n}\frac{f^{(k)}(0)}{k!}x^k+R_n(x)
$$

指数函数的各阶导数仍是指数函数，因此

$$
e^x=\sum_{k=0}^{n}\frac{x^k}{k!}+R_n(x)
$$

泰勒余项满足

$$
|R_n(x)|\le e^{|x|}\frac{|x|^{n+1}}{(n+1)!}\to0
$$

所以对任意实数 $x$，都有

$$
e^x=\sum_{k=0}^{\infty}\frac{x^k}{k!}
$$

对复数 $z$，相邻两项绝对值之比为

$$
\left|\frac{z^{k+1}/(k+1)!}{z^k/k!}\right|
=\frac{|z|}{k+1}\to0
$$

它对任意有限的 $z$ 都绝对收敛，因此指数函数幂级数的收敛半径为

$$
R=\infty
$$

### A.4 欧拉公式

用收敛半径为无穷的幂级数定义复指数函数：

$$
e^z=\sum_{k=0}^{\infty}\frac{z^k}{k!}
$$

令 $z=i\theta$，将偶数项与奇数项分开：

$$
\begin{aligned}
e^{i\theta}
&=\left(1-\frac{\theta^2}{2!}+\frac{\theta^4}{4!}-\cdots\right)\\
&\quad+i\left(\theta-\frac{\theta^3}{3!}+\frac{\theta^5}{5!}-\cdots\right)\\
&=\cos\theta+i\sin\theta
\end{aligned}
$$

因此

$$
e^{i\theta}=\cos\theta+i\sin\theta
$$

反过来，

$$
\cos\theta=\frac{e^{i\theta}+e^{-i\theta}}{2},
\qquad
\sin\theta=\frac{e^{i\theta}-e^{-i\theta}}{2i}
$$

### A.5 卷积定理

两个函数 $f$、$g$ 的卷积定义为

$$
(f*g)(t)=\int_{-\infty}^{\infty}
f(\tau)g(t-\tau)\,d\tau
$$

令 $h=f*g$，并分别用 $F(\omega)$、$G(\omega)$、$H(\omega)$ 表示 $f$、$g$、$h$ 的频谱。在积分允许交换顺序时，

$$
\begin{aligned}
H(\omega)
&=\int_{-\infty}^{\infty}
\left[\int_{-\infty}^{\infty}
f(\tau)g(t-\tau)\,d\tau\right]e^{-i\omega t}\,dt\\
&=\int_{-\infty}^{\infty}f(\tau)
\left[\int_{-\infty}^{\infty}
g(t-\tau)e^{-i\omega t}\,dt\right]d\tau\\
&=\int_{-\infty}^{\infty}f(\tau)
\left[\int_{-\infty}^{\infty}
g(u)e^{-i\omega(u+\tau)}\,du\right]d\tau\\
&=\left[\int_{-\infty}^{\infty}
f(\tau)e^{-i\omega\tau}\,d\tau\right]
\left[\int_{-\infty}^{\infty}
g(u)e^{-i\omega u}\,du\right]\\
&=F(\omega)G(\omega)
\end{aligned}
$$

其中令 $u=t-\tau$，并使用

$$
e^{-i\omega(u+\tau)}=e^{-i\omega u}e^{-i\omega\tau}
$$

将只含 $u$ 与只含 $\tau$ 的部分分开。因此

$$
H(\omega)=F(\omega)G(\omega)
$$

即时域卷积在频域中变成普通乘法。
