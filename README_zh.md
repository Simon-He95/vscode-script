<p align="center">
<img height="200" src="./assets/kv.png" alt="vscode script">
</p>
<p align="center"> <a href="./README.md">English</a> | 简体中文</p>

vscode 插件 将当前项目下的脚本命令可视化，点击即可执行

## Warning
Makefile 需要安装 [gum](https://github.com/charmbracelet/gum), 如果你需要使用, 请先安装gum

## 💪 Support
- yarn
- npm
- pnpm
- Makefile
  - 如果你没有权限去执行命令，试着将下面的配置加入你的vscode settings.json中

## Auth
```
{
  "vscode-script":{
    "auth": "sudo",
    "fontSize": "12px"
  }
}
```
### Dark:
![demo](/assets/dark.gif)

### Light:
![demo](/assets/light.gif)

## :coffee:

[请我喝一杯咖啡](https://github.com/Simon-He95/sponsor)

## License

[MIT](./license)
