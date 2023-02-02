# blunderdome

![A blunderdome spawnpoint](blunderbee.png)

Half of a [TypescriptToLua] implementation for [/tg/station]'s AuxLua to replace Central Command with an automated
thunderdome. Observers can spawn themselves with all-access and a random weapon without needing a four-year degree on
how to click a life candle.

[TypescriptToLua]: https://typescripttolua.github.io/
[/tg/station]: https://github.com/tgstation/tgstation

While this is almost certainly a complete waste of time beyond a proof-of-concept, it's still pretty neat.

To use:

```bash
npm install -D
npm run build
```

Then copy the contents of `build/blunderdome.lua` into the admin Lua editor in `Debug => Open Lua Editor`.

## License

GPLv3. See `LICENSE`.
