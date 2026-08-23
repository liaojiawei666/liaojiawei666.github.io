---
title: 2026-08-21 网络流
type: log
pubDate: 2026-08-21
---

## 1. 什么是网络流

### 1.1 交通调度

某个国家有 $n$ 个城市，相邻城市之间共有 $m$ 条高速公路。每辆车经过一条高速公路都要 $1$ 小时；路宽不同，所以同一时刻各条路能容纳的车数也不同。高速公路可以双向开，但两个方向各有各的容量，互不占用。

无数辆车要从同一个起点城市开到同一个终点城市，中途不允许停留。问：同一时刻最多能发出多少辆车？

下图是一个具体例子。

![带容量的流网络](/diagrams/network-flow/traffic-network.drawio.svg)

- 共有四个城市 $s,a,b,t$。$s$ 是起点，$t$ 是终点，所有车都从 $s$ 开到 $t$。
- 边上的数字是该方向同一时刻的容量。例如 $s\to a$ 最多同时容纳 $1$ 辆车。
- 每个小时发一次车，每条路都走 $1$ 小时，中途城市不许停车。问每个小时最多能发多少辆。

同一张路上，调度方案不同，每个小时能发出的车数也可以不同。下图左边和右边是两种都合法的方案；绿色是这一小时有车在走的路，灰色是没走的路。边上写成「正在开的车 / 容量」。

![两种派车方案](/diagrams/network-flow/two-schemes.drawio.svg)

方案一走中间的 $a\to b$，占住 $s\to a$ 和 $b\to t$，上下直达走不成，每小时只能发 $1$ 辆。方案二走 $s\to a\to t$ 与 $s\to b\to t$ 两条不相交的路，每小时发 $2$ 辆。

### 1.2 定义

把上面的发车问题写成数学对象，就是流网络，记为有向图 $G=(V,E)$：点是城市，边是公路的一个方向。双向公路写成两条边，去和回各算各的。指定起点 $s$、终点 $t$。

每条边有非负容量 $c(e)$：该方向同一时刻最多能容纳多少辆车。

流 $f$ 是一种调度方案，$f(e)$ 是这个方案里沿边 $e$ 走的车数。合法方案要满足两条约束。

① 容量约束：路上的车不能是负数，也不能超过该方向的容量。

$$
0\le f(e)\le c(e)
$$

② 流量守恒：除 $s$、$t$ 外，开进一个城市的车必须全部开出，中途不许停车。

$$
\sum_{u:(u,v)\in E}f(u,v)
=
\sum_{w:(v,w)\in E}f(v,w),
\qquad
v\in V\setminus\{s,t\}
$$

流值 $|f|$ 是离开起点 $s$ 的净车数，也就是这个方案这一小时发出了多少辆；它等于到达终点 $t$ 的净车数。

$$
|f|
=
\sum_{w:(s,w)\in E}f(s,w)
-
\sum_{u:(u,s)\in E}f(u,s)
$$

最大流就是使 $|f|$ 最大的那种调度方案。

## 2. Ford–Fulkerson

### 2.1 方案探索

先选择一种调度方案：沿 $s\to a\to b\to t$ 派出 $1$ 单位流量。这是一个合法方案。

![随机派出一辆后再往 b 派一辆走不通](/diagrams/network-flow/random-scheme.drawio.svg)

接着尝试沿 $s\to b$ 继续派流量。流量到达 $b$ 后，发现 $b\to t$ 的容量已经被原方案占满，无法继续到达 $t$。

这个例子很简单：把原来的路线改成 $s\to a\to t$，再让新流量沿 $s\to b\to t$ 发送，就能把流值从 $1$ 增加到 $2$。

但是，当流网络变得复杂后怎么办？如何改变之前的调度方案，使它适配新的流量？算法如何终止？

### 2.2 寻找增广路

先分析一种特殊情况。本节用 $u\to v$ 表示相邻节点之间的一条边，用 $u\rightsquigarrow v$ 表示一段可能经过多个中间节点的曲线路径。

当前有 $x$ 单位流量沿 $s\rightsquigarrow a\to b\rightsquigarrow t$ 发送。把这条旧流量反过来写成虚线，就表示对应部分最多可以撤销 $x$。反向虚线只是修改方案的余地，不表示车辆真的倒着开。

再把普通实线表示的剩余容量接起来。如果能拼出

$$
s\rightsquigarrow c\to b\to a\rightsquigarrow t,
$$

就得到了一条新的调整路径。其中 $b\to a$ 走反向虚线，其余部分走剩余容量。这条路径最终能够增加从 $s$ 到 $t$ 的流量，因此叫作**增广路**。

![把旧流量反向表示，并拼出新的调整路径](/diagrams/network-flow/flow-reversal-new-path.drawio.svg)

设整条调整路径最多还能通过 $y$，其中 $y\le x$。接下来经过两次实际修改，再把新流量反向记录。

第一步，把原来沿 $a\to b\rightsquigarrow t$ 发送的 $y$ 改走曲线 $a\rightsquigarrow t$。$a\to b$ 与 $b\rightsquigarrow t$ 都释放出 $y$ 的剩余容量，总流值仍是 $x$。

第二步，沿 $s\rightsquigarrow c\to b\rightsquigarrow t$ 引入红色的新流量 $y$。它会用掉 $b\rightsquigarrow t$ 刚释放的容量，但 $a\to b$ 上释放的 $y$ 仍然保留。最终流值变为 $x+y$。最后把新流量也反向记录，供后续修改。

![找到调整路径、重路由、引入新流量并反向记录](/diagrams/network-flow/flow-rerouting-augmentation.drawio.svg)

这整个过程叫作**增广**。$y$ 由整条调整路径最窄的位置决定：普通实线受剩余容量限制，反向虚线受可撤销量限制。

所有边的增减同时发生，所以每个中间节点仍满足流量守恒。

对原边 $u\to v$，当前流量为 $f(u,v)$ 时，正向剩余容量是 $c(u,v)-f(u,v)$，反向可撤销量是 $f(u,v)$。

沿增广路增加 $y$ 时，路径上每条边的可用量减去 $y$，反向边的可用量增加 $y$；下图红色部分就是把 $s\rightsquigarrow c\to b\to a\rightsquigarrow t$ 上的 $y$ 取反。

![增广前后的路径方向对比](/diagrams/network-flow/augmenting-path-reversal.drawio.svg)

### 2.3 算法伪代码

Ford–Fulkerson 不规定怎样寻找增广路。给原图中的每条边 $e$ 建立一条独立的配对反向边 $\operatorname{rev}(e)$，用 $r(e)$ 表示当前可用量：

```text
for 原图中的每条边 e:
    r(e) = c(e)
    r(rev(e)) = 0

flow = 0

while 能找到一条从 s 到 t 的增广路 P:
    Δ = min{r(e) | e 在 P 上}

    for P 上的每条边 e:
        r(e) -= Δ
        r(rev(e)) += Δ

    flow += Δ

return flow
```

每轮都会使总流值增加 $\Delta$：中间节点同时增加一份流入和流出，只有 $s$ 的净流出与 $t$ 的净流入增加 $\Delta$。

对每条原边 $e$，配对反向边中的可用量记录了原边上的流量；把所有反向记录翻回原边方向，就能逐边还原一份流值相同的流。这里的一一对应发生在配对边之间，流量路径的分解不一定唯一。

## 3. 最大流与最小割

Ford–Fulkerson 不断寻找增广路，直到再也找不到。算法停止只说明当前流无法继续调整，还不能直接说明它已经是最大流；要证明这一点，先从一种划分节点的方法——割——开始。

### 3.1 割

一个 $s$-$t$ 割是对全部节点的划分 $(S,T)$，满足 $S\cup T=V$、$S\cap T=\varnothing$、$s\in S$、$t\in T$。割本身是节点的划分，不是一组被删除的边。

从 $S$ 指向 $T$ 的边叫作割边。割的容量是这些边的容量之和：

$$
c(S,T)=\sum_{u\in S,\,v\in T}c(u,v).
$$

方向不能忽略：从 $T$ 指向 $S$ 的边不计入 $c(S,T)$。同一张网络可以按照多种方式划分节点，因此可以产生多个不同的割。

一个流穿过割的**净流量**，等于从 $S$ 流向 $T$ 的流量减去从 $T$ 流回 $S$ 的流量：

$$
f(S,T)
=
\sum_{u\in S,\,v\in T}f(u,v)
-
\sum_{u\in T,\,v\in S}f(u,v).
$$

割容量只计算正向边的容量，割净流量则要减去反向流量。

![同一张网络的三种割](/diagrams/network-flow/same-network-different-cuts.drawio.svg)

图中三种划分的割容量分别是 $6$、$8$ 和 $7$。在所有割中，容量最小的割叫作**最小割**。

### 3.2 残量网络

给定流网络 $G=(V,E,c)$ 与可行流 $f$。对每条原边 $e=(u,v)\in E$，用 $\bar e=(v,u)$ 表示与它配对的反向边，并记

$$
\bar E=\{\bar e\mid e\in E\}.
$$

原边及其配对反向边的**残量容量**定义为

$$
c_f(e)=c(e)-f(e),
\qquad
c_f(\bar e)=f(e).
$$

只保留残量容量大于 $0$ 的边：

$$
E_f=\{a\in E\cup\bar E\mid c_f(a)>0\}.
$$

由此得到可行流 $f$ 对应的**残量网络**：

$$
G_f=(V,E_f,c_f).
$$

图中灰线表示原方向的残量容量，红线表示可行流；得到 $G_f$ 时，灰线方向不变，红线方向反转。

![流 f 与对应的残量网络 G_f](/diagrams/network-flow/flow-to-residual-network.drawio.svg)

反向边 $\bar e$ 只是原边 $e$ 的配对边，不要求它存在于原图中。如果原图本来就有一条 $v\to u$，它与 $\bar e$ 仍是两条不同的边。

### 3.3 最大流最小割定理

**最大流最小割定理**指出：最大流的流值等于最小割的容量。

$$
\max_f |f|=\min_{(S,T)}c(S,T).
$$

证明只需要两步：先说明任意割都是任意流的上界，再说明没有增广路时，可以构造一组流值与割容量相等的流和割。

**第一步：任意流的流值不超过任意割的容量。**

先证明任意割的净流量都等于整个网络的流值。定义节点 $u$ 的净流出量：

$$
\operatorname{net}_f(u)
=
\sum_{v\in V}f(u,v)
-
\sum_{v\in V}f(v,u).
$$

因为 $(S,T)$ 是一个 $s$-$t$ 割，所以 $s\in S$、$t\in T$。$S\setminus\{s\}$ 中的节点都是中间节点，净流出量均为 $0$；只有源点满足 $\operatorname{net}_f(s)=|f|$。因此

$$
\begin{aligned}
|f|
&=\sum_{u\in S}\operatorname{net}_f(u)\\
&=\sum_{u\in S}\sum_{v\in V}f(u,v)
-\sum_{u\in S}\sum_{v\in V}f(v,u)\\
&=\sum_{u\in S}\sum_{v\in S}f(u,v)
+\sum_{u\in S}\sum_{v\in T}f(u,v)\\
&\quad-\sum_{u\in S}\sum_{v\in S}f(v,u)
-\sum_{u\in S}\sum_{v\in T}f(v,u).
\end{aligned}
$$

前后两个 $S$ 内部的求和只交换了变量名，因此完全相等并相互抵消。剩下的正是割的净流量：

$$
\begin{aligned}
|f|
&=\sum_{u\in S}\sum_{v\in T}f(u,v)
-\sum_{u\in S}\sum_{v\in T}f(v,u)\\
&=f(S,T).
\end{aligned}
$$

再证明割的净流量不超过割容量。反向流量非负，正向流量不超过对应边的容量，因此

$$
\begin{aligned}
f(S,T)
&=\sum_{u\in S,\,v\in T}f(u,v)
-\sum_{u\in T,\,v\in S}f(u,v)\\
&\le \sum_{u\in S,\,v\in T}f(u,v)\\
&\le \sum_{u\in S,\,v\in T}c(u,v)\\
&=c(S,T).
\end{aligned}
$$

结合两部分，对任意可行流 $f$ 和任意割 $(S,T)$ 都有

$$
|f|\le c(S,T).
$$

**第二步：没有增广路时，构造一个与流值相等的割。**

设可行流 $f$ 对应的残量网络为 $G_f$，并且 $G_f$ 中找不到从 $s$ 到 $t$ 的增广路。令 $S$ 为 $G_f$ 中从 $s$ 可达的全部节点，令 $T=V-S$。因为 $t$ 不可达，所以 $s\in S$、$t\in T$，$(S,T)$ 构成一个割。

![从没有增广路的残量网络构造等值割](/diagrams/network-flow/terminal-residual-cut.drawio.svg)

对任意原边 $u\to v$，其中 $u\in S$、$v\in T$。如果 $c_f(u,v)>0$，那么 $v$ 也能从 $s$ 到达，与 $v\in T$ 矛盾。因此

$$
c_f(u,v)=c(u,v)-f(u,v)=0,
$$

所以

$$
f(u,v)=c(u,v),
$$

即所有从 $S$ 指向 $T$ 的原边都已满流。

再考虑任意原边 $u\to v$，其中 $u\in T$、$v\in S$。它配对的反向边 $v\to u$ 从 $S$ 指向 $T$，同理，其残量容量必须为 $0$，因此

$$
c_f(v,u)=f(u,v)=0.
$$

所以从 $S$ 指向 $T$ 的流量等于对应边的容量，从 $T$ 指向 $S$ 的流量为 $0$：

$$
|f|=f(S,T)=c(S,T).
$$

第一步说明任意流都不超过任意割；现在存在一组流和割恰好相等。因此这个流是最大流，这个割是最小割，并且最大流值等于最小割容量。

### 3.4 结论

只要找到一个可行流 $f$，并且它对应的残量网络 $G_f$ 中不存在从 $s$ 到 $t$ 的增广路，那么 $f$ 就是最大流。

## 4. Edmonds–Karp

Ford–Fulkerson 不规定如何寻找增广路。如果容量为整数，一种糟糕的选路方式可能每次只增加 $1$ 单位流量，使复杂度达到 $O(EF)$，其中 $F$ 是最大流值。

**Edmonds–Karp** 固定使用 BFS，每次选择残量网络中边数最少的增广路。增广方式没有变化，变化的只是选路规则。

### 4.1 用 BFS 寻找最短增广路

在残量网络 $G_f$ 中，定义 $d_f(v)$ 为从 $s$ 到 $v$ 最少需要经过的边数。BFS 按照距离递增的顺序访问节点，因此第一次到达 $t$ 时，得到的就是一条最短增广路。

![Edmonds–Karp 使用 BFS 选择边数最少的增广路](/diagrams/network-flow/edmonds-karp-bfs.drawio.svg)

这里的“最短”只表示经过的边最少，不表示剩余容量最大。找到路径后，仍然取路径上的最小残量容量 $\Delta$，再完成一次普通增广。

### 4.2 为什么复杂度与最大流值无关

关键性质是：每次增广之后，从 $s$ 到任意节点的最短距离都不会减小。

设增广前后的距离分别为 $d(v)$ 和 $d'(v)$。假设某个节点满足 $d'(v)<d(v)$，并选择新距离最小的这种节点。令 $u$ 是新最短路上 $v$ 的前驱，则

$$
d'(u)=d'(v)-1,
\qquad
d'(u)\ge d(u).
$$

如果增广前已经存在残量边 $u\to v$，就有

$$
d(v)\le d(u)+1\le d'(u)+1=d'(v),
$$

与 $d'(v)<d(v)$ 矛盾。因此 $u\to v$ 只能是本次增广新产生的反向边，也就是旧的最短增广路经过了 $v\to u$。旧距离满足

$$
d(u)=d(v)+1.
$$

于是

$$
d'(v)=d'(u)+1\ge d(u)+1=d(v)+2,
$$

仍然矛盾。因此所有节点的最短距离都不会减小。

每次增广至少会用满一条残量边。若同一条边 $u\to v$ 以后再次被用满，中间必须先沿反向边 $v\to u$ 增广，使 $u\to v$ 恢复残量容量。前后两次用满之间，$u$ 的距离至少增加 $2$。

节点距离最大为 $V-1$，所以每条边最多被反复用满 $O(V)$ 次。共有 $O(E)$ 条边，因此增广次数为 $O(VE)$；每次 BFS 和更新路径需要 $O(E)$，总复杂度为

$$
O(VE^2).
$$

这个上界只由图的节点数和边数决定，与最大流值 $F$ 无关。

### 4.3 算法伪代码

```text
flow = 0

while BFS(G_f, s, t) 能找到增广路:
    用 parent[] 从 t 还原到 s
    Δ = 路径上的最小残量容量

    for 路径上的每条边 u → v:
        c_f(u, v) -= Δ
        c_f(v, u) += Δ

    flow += Δ

return flow
```

## 5. Dinic

Edmonds–Karp 每找到一条增广路，就重新执行一次 BFS。但一次 BFS 已经得到整张图的距离信息，只使用其中一条路径会浪费这些信息。

**Dinic** 的做法是：先用 BFS 建立分层图，再用 DFS 在分层图中不断增广，直到本轮所有最短增广路都被阻塞。

### 5.1 分层图

BFS 计算每个节点的层数：

$$
\operatorname{level}(v)=d_f(v).
$$

此时只是给节点标记层数，残量网络中的边还全部保留。

![BFS 标记层次后的残量网络](/diagrams/network-flow/dinic-residual-levels.drawio.svg)

只保留满足下面两个条件的残量边 $u\to v$：

$$
c_f(u,v)>0,
\qquad
\operatorname{level}(v)=\operatorname{level}(u)+1.
$$

![删除同层边和反向边后得到分层图](/diagrams/network-flow/dinic-level-graph.drawio.svg)

第二张图中的虚线只用来标记被删除的边，它们不属于分层图，DFS 不能经过。DFS **只能沿着层数增加 $1$ 的边前进**；同层边和指向更低层的反向边都会被删除。

保留下来的边组成**分层图**。边只会从第 $i$ 层指向第 $i+1$ 层，因此分层图中没有环；其中每条 $s$ 到 $t$ 的路径都是当前残量网络中的最短增广路。

### 5.2 阻塞流

Dinic 不在分层图中只找一条路径，而是用 DFS 尽量向前推流，直到每条 $s$ 到 $t$ 的路径上都至少有一条边被用满。此时得到的流叫作**阻塞流**。

![Dinic 从残量网络建立分层图并寻找阻塞流](/diagrams/network-flow/dinic-level-blocking-flow.drawio.svg)

这里的 DFS 与 Ford–Fulkerson 中任意寻找增广路的 DFS 不同：它只能沿着层数增加 $1$ 的边前进。BFS 控制全局方向，DFS 只负责在当前分层图中一次推送尽可能多的流量。

实现时通常使用**当前弧优化**。$\operatorname{cur}(u)$ 记录节点 $u$ 下一条尚未处理的边；一条边已经用满或已经无法继续推流后，本轮不再从头检查它。

### 5.3 代码实现

下面的 `cap` 始终表示当前残量容量；每条正向边都配有一条初始容量为 $0$ 的反向边。

```cpp
#include <algorithm>
#include <limits>
#include <queue>
#include <vector>

struct Dinic {
    using i64 = long long;

    struct Edge {
        int to;
        int rev;
        i64 cap;
    };

    std::vector<std::vector<Edge>> graph;
    std::vector<int> level;
    std::vector<int> cur;

    explicit Dinic(int n) : graph(n), level(n), cur(n) {}

    void addEdge(int u, int v, i64 cap) {
        Edge forward{v, static_cast<int>(graph[v].size()), cap};
        Edge reverse{u, static_cast<int>(graph[u].size()), 0};
        graph[u].push_back(forward);
        graph[v].push_back(reverse);
    }

    bool bfs(int s, int t) {
        std::fill(level.begin(), level.end(), -1);
        std::queue<int> queue;
        level[s] = 0;
        queue.push(s);

        while (!queue.empty()) {
            int u = queue.front();
            queue.pop();

            for (const Edge& edge : graph[u]) {
                if (edge.cap > 0 && level[edge.to] == -1) {
                    level[edge.to] = level[u] + 1;
                    queue.push(edge.to);
                }
            }
        }
        return level[t] != -1;
    }

    i64 dfs(int u, int t, i64 limit) {
        if (u == t) {
            return limit;
        }

        for (int& i = cur[u]; i < static_cast<int>(graph[u].size()); ++i) {
            Edge& edge = graph[u][i];
            if (edge.cap == 0 || level[edge.to] != level[u] + 1) {
                continue;
            }

            i64 pushed = dfs(edge.to, t, std::min(limit, edge.cap));
            if (pushed == 0) {
                continue;
            }

            edge.cap -= pushed;
            graph[edge.to][edge.rev].cap += pushed;
            return pushed;
        }
        return 0;
    }

    i64 maxFlow(int s, int t) {
        i64 flow = 0;
        const i64 inf = std::numeric_limits<i64>::max();

        while (bfs(s, t)) {
            std::fill(cur.begin(), cur.end(), 0);
            while (i64 pushed = dfs(s, t, inf)) {
                flow += pushed;
            }
        }
        return flow;
    }
};
```

### 5.4 时间复杂度分析

一轮结束后，当前分层图中不再存在 $s$ 到 $t$ 的路径。重新执行 BFS 时，$t$ 的层数必然严格增加，所以 BFS 最多执行 $V-1$ 轮。

使用当前弧优化后，一轮阻塞流的复杂度为 $O(VE)$；乘上最多 $O(V)$ 轮，Dinic 在一般图上的时间复杂度为

$$
O(V^2E).
$$

三种方法的核心区别可以归结为如何使用增广路：

| 方法 | 选路方式 | 一次 BFS 后做什么 | 一般复杂度 |
| --- | --- | --- | --- |
| Ford–Fulkerson | 任意增广路 | 不固定使用 BFS | $O(EF)$（整数容量） |
| Edmonds–Karp | BFS 找一条最短增广路 | 增广一次后重新 BFS | $O(VE^2)$ |
| Dinic | BFS 建立分层图 | DFS 求出阻塞流 | $O(V^2E)$ |
