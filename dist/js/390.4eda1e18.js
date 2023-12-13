"use strict";(self["webpackChunkblog"]=self["webpackChunkblog"]||[]).push([[390],{6390:function(n,s,a){a.r(s),a.d(s,{default:function(){return k}});var t=a(3396);const p={class:"content"},e=(0,t.uE)('<h1 class="post-title">Forge 开发日志（一）<a class="header-anchor" id="Forge%20%E5%BC%80%E5%8F%91%E6%97%A5%E5%BF%97%EF%BC%88%E4%B8%80%EF%BC%89" href="#Forge%20%E5%BC%80%E5%8F%91%E6%97%A5%E5%BF%97%EF%BC%88%E4%B8%80%EF%BC%89">#</a></h1><div class="metabar"><div class="metabar-item">2023/07/02</div><div class="metabar-item">代码</div><div class="metabar-item">约 6 分钟读完</div></div><p>Forge 在此前总是给了我一种类似于 modding API 的错觉，而当我真正开始写 Forge 模组的时候，我才发现其实大部分时候都是在和 NMS 打交道，也就是 <code>net.minecraft.server</code>。这就自然而然带来了一个极为令人头疼的问题：没有文档。Forge 官方的文档，只能说是在自说自话，但也确实是介绍了一些 Forge 自身的申必概念，比如 <em>Capability</em>，这个词看来是完全没办法翻译成中文了。</p><p>回到正题来，在 Bukkit 上对 NMS 的访问并不是没有，但是经常被视作是应当避免的。这也是可以理解的，因为借助[反射]的方式在运行时修改内部逻辑，不仅问题会很多，代码也会很 dirty。即使这样，一些插件依然得以实现向游戏中添加一些带有新的材质的方块，但是很显然——都是采用了间接的方式，极容易出问题。拿 ItemAdder 来说，它添加的方块并不是独立的个体，而是由对某种方块的修改得来。我们可以猜到这是因为 API 的限制。这种间接创造新方块的方法直接将运行时稳定性托付给了这种方块自身。一旦该方块满足某些特性，被某些其它插件利用时，就会发生一系列不可见的冲突。这就是一种不可调和的 dirty modding。</p><p>那么如果想要从游戏本体的层面真正地添加东西进去，甚至添加模型、添加音乐，让游戏自身变得截然不同，就不得不用到 Forge 之类的 API 了。</p><p>在使用的过程中，首先面临的问题就是文档的缺乏，加上论坛的不发达。这让一些函数的使用非常的费解。不过，还是先聊聊收获吧。下面列出了最近几天我在使用 Forge 写一个与 MC 本体并无过大关联的模组的过程中，一些收获和见解。这些东西都难以在文档中看见，只能自己总结——也是没谁了。</p><h2>1. Server 实例在哪里？<a class="header-anchor" id="1.%20Server%20%E5%AE%9E%E4%BE%8B%E5%9C%A8%E5%93%AA%E9%87%8C%EF%BC%9F" href="#1.%20Server%20%E5%AE%9E%E4%BE%8B%E5%9C%A8%E5%93%AA%E9%87%8C%EF%BC%9F">#</a></h2><p>在 Bukkit 中，每当我们需要获得一些有关于 server 的参数或者做一些操作的时候，都需要用到 Server 实例。这一点，在 Bukkit 中是直接提供的。</p><div class="language-java"><pre class="language-java"><code class="language-java"><span class="token keyword">var</span> server <span class="token operator">=</span> <span class="token class-name">Bukkit</span><span class="token punctuation">.</span><span class="token function">getServer</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n</code></pre></div><p>可是当我天真的想要找 <code>Forge#getServer()</code> 的时候，发现怎么找也找不到。后来才发现<em>通常</em>的做法就是间接获取。可以从某个<em>偶然</em>得到的对象，例如 <code>ServerPlayer</code>、<code>Entity</code> 等，中调用 <code>getServer</code> 方法。为了代码不至于过于迷惑，我突然想到了服务器开启的事件，以及该事件对应的 target（js 说法）。于是通过下面的方法成功获得了，Server 实例。</p><div class="language-java"><pre class="language-java"><code class="language-java"><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">Main</span> <span class="token punctuation">{</span>\n    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token class-name">MinecraftServer</span> server <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span>\n    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">boolean</span> ready <span class="token operator">=</span> <span class="token boolean">false</span><span class="token punctuation">;</span>\n<span class="token punctuation">}</span>\n\n<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">Events</span> <span class="token punctuation">{</span>\n    <span class="token annotation punctuation">@SubscribeEvent</span> <span class="token comment">// 在 Forge 中，连监听事件你甚至都能玩出花来</span>\n    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">void</span> <span class="token function">serverStarted</span><span class="token punctuation">(</span><span class="token class-name">ServerStartedEvent</span> e<span class="token punctuation">)</span> <span class="token punctuation">{</span>\n        <span class="token class-name">Main</span><span class="token punctuation">.</span>server <span class="token operator">=</span> e<span class="token punctuation">.</span><span class="token function">getServer</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n        <span class="token class-name">Main</span><span class="token punctuation">.</span>ready <span class="token operator">=</span> <span class="token boolean">true</span><span class="token punctuation">;</span>\n        log<span class="token punctuation">.</span><span class="token function">info</span><span class="token punctuation">(</span><span class="token string">&quot;SeatiCore has got the server instance.&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token punctuation">}</span>\n<span class="token punctuation">}</span>\n</code></pre></div><h3>连监听事件你甚至都能玩出花来</h3><p>此话怎讲？从<a href="https://docs.minecraftforge.net/en/1.20.x/events/intro/" class="external-link" target="_blank" rel="noopener noreferrer">官方文档<span class="external-link-icon mdi mdi-launch"></span></a>中看来，这些没用的东西倒是可以整挺多，介绍挺详细的。</p><p><strong>eg1. Event Handler</strong></p><div class="language-java"><pre class="language-java"><code class="language-java"><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">MyForgeEventHandler</span> <span class="token punctuation">{</span>\n    <span class="token annotation punctuation">@SubscribeEvent</span>\n    <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">pickupItem</span><span class="token punctuation">(</span><span class="token class-name">EntityItemPickupEvent</span> event<span class="token punctuation">)</span> <span class="token punctuation">{</span>\n        <span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span><span class="token string">&quot;Item picked up!&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token punctuation">}</span>\n<span class="token punctuation">}</span>\n</code></pre></div><p><strong>eg2. Static Event Handler</strong></p><div class="language-java"><pre class="language-java"><code class="language-java"><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">MyStaticForgeEventHandler</span> <span class="token punctuation">{</span>\n    <span class="token annotation punctuation">@SubscribeEvent</span>\n    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">void</span> <span class="token function">arrowNocked</span><span class="token punctuation">(</span><span class="token class-name">ArrowNockEvent</span> event<span class="token punctuation">)</span> <span class="token punctuation">{</span>\n        <span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span><span class="token string">&quot;Arrow nocked!&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token punctuation">}</span>\n<span class="token punctuation">}</span>\n</code></pre></div><p><strong>eg3. Automatically Registering</strong></p><div class="language-java"><pre class="language-java"><code class="language-java"><span class="token annotation punctuation">@Mod.EventBusSubscriber</span><span class="token punctuation">(</span><span class="token class-name">Dist</span><span class="token punctuation">.</span><span class="token constant">CLIENT</span><span class="token punctuation">)</span>\n<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">MyStaticClientOnlyEventHandler</span> <span class="token punctuation">{</span>\n    <span class="token annotation punctuation">@SubscribeEvent</span>\n    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">void</span> <span class="token function">drawLast</span><span class="token punctuation">(</span><span class="token class-name">RenderWorldLastEvent</span> event<span class="token punctuation">)</span> <span class="token punctuation">{</span>\n        <span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span><span class="token string">&quot;Drawing!&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token punctuation">}</span>\n<span class="token punctuation">}</span>\n</code></pre></div><p>这其实还不是完全形态。对于 Forge 的这种魔幻侧重点和 API 设计，我不好多说什么。</p><h2>2. 迷惑就完事了<a class="header-anchor" id="2.%20%E8%BF%B7%E6%83%91%E5%B0%B1%E5%AE%8C%E4%BA%8B%E4%BA%86" href="#2.%20%E8%BF%B7%E6%83%91%E5%B0%B1%E5%AE%8C%E4%BA%8B%E4%BA%86">#</a></h2><p>虽然我本人对 Java 的理解和掌握程度仅限于能抄抄代码运行一下的样子，但是我还是想说有些操作还是太迷惑了。不全是 Forge 的锅。</p><p>猜猜看下面的代码是用来干什么的？</p><div class="language-java"><pre class="language-java"><code class="language-java"><span class="token keyword">import</span> <span class="token import"><span class="token namespace">net<span class="token punctuation">.</span>minecraftforge<span class="token punctuation">.</span>common<span class="token punctuation">.</span></span><span class="token class-name">MinecraftForge</span></span><span class="token punctuation">;</span>\n<span class="token keyword">import</span> <span class="token import"><span class="token namespace">net<span class="token punctuation">.</span>minecraftforge<span class="token punctuation">.</span>fml<span class="token punctuation">.</span></span><span class="token class-name">IExtensionPoint</span></span><span class="token punctuation">;</span>\n<span class="token keyword">import</span> <span class="token import"><span class="token namespace">net<span class="token punctuation">.</span>minecraftforge<span class="token punctuation">.</span>fml<span class="token punctuation">.</span></span><span class="token class-name">ModLoadingContext</span></span><span class="token punctuation">;</span>\n<span class="token keyword">import</span> <span class="token import"><span class="token namespace">net<span class="token punctuation">.</span>minecraftforge<span class="token punctuation">.</span>fml<span class="token punctuation">.</span>common<span class="token punctuation">.</span></span><span class="token class-name">Mod</span></span><span class="token punctuation">;</span>\n<span class="token keyword">import</span> <span class="token import"><span class="token namespace">net<span class="token punctuation">.</span>minecraftforge<span class="token punctuation">.</span>network<span class="token punctuation">.</span></span><span class="token class-name">NetworkConstants</span></span><span class="token punctuation">;</span>\n\n<span class="token comment">// Make sure the mod being absent on the other network side does not cause the client to display the server as incompatible</span>\n<span class="token class-name">ModLoadingContext</span><span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token punctuation">)</span>\n<span class="token punctuation">.</span><span class="token function">registerExtensionPoint</span><span class="token punctuation">(</span>\n    <span class="token class-name">IExtensionPoint<span class="token punctuation">.</span>DisplayTest</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">,</span>\n    <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">-&gt;</span> <span class="token keyword">new</span> <span class="token class-name">IExtensionPoint<span class="token punctuation">.</span>DisplayTest</span><span class="token punctuation">(</span>\n        <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">-&gt;</span> <span class="token class-name">NetworkConstants</span><span class="token punctuation">.</span><span class="token constant">IGNORESERVERONLY</span><span class="token punctuation">,</span>\n        <span class="token punctuation">(</span>a<span class="token punctuation">,</span> b<span class="token punctuation">)</span> <span class="token operator">-&gt;</span> <span class="token boolean">true</span>\n    <span class="token punctuation">)</span>\n<span class="token punctuation">)</span><span class="token punctuation">;</span>\n</code></pre></div><p>没错！它是用来避免<em>单侧模组</em>被错误处理哒！</p><blockquote><p>This tells the client that it should ignore the server version being absent, and the server that it should not tell the client this mod should be present. So this snippet works both for client- and server-only-sided mods.</p></blockquote><p>起初我是在 FTB 系列的某个模组中看到了它，我还寻思模组水平要求的确蹭蹭上来了。看了文档以后才发现，唯一的方法就是复读。</p>',27),o=[e];function c(n,s){return(0,t.wg)(),(0,t.iD)("div",p,o)}var l=a(89);const u={},i=(0,l.Z)(u,[["render",c]]);var k=i}}]);
//# sourceMappingURL=390.4eda1e18.js.map