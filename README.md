<p align="center">
<img height="200" src="./assets/kv.png" alt="vscode script">
</p>
<p align="center"> English | <a href="./README_zh.md">简体中文</a></p>

The vscode plugin visualizes the script commands under the current project and executes them by clicking

## 💪 Support
- yarn
- npm
- pnpm
- Makefile 
  - if you don't have permission to run, add the below config into your vscode settings.json

## Auth
```
{
  "vscode-script":{
    "auth": "sudo"
  }
}
```

### CustomColors
- fontSize
- iconColor
- commandDetailColor
- commandLabelColor
- filePathColor
- labelColor

![CustomColors](/assets/demo1.gif)

### Dark:
![demo](/assets/dark.gif)

### Light:
![demo](/assets/light.gif)

## :coffee:

[buy me a cup of coffee](https://github.com/Simon-He95/sponsor)

## License

[MIT](./license)
