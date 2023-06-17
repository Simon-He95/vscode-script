<p align="center">
<img height="200" src="./assets/kv.png" alt="vscode script">
</p>
<p align="center"> <a href="./README.md">English</a> | 简体中文</p>

vscode 插件 将当前项目下的脚本命令可视化，点击即可执行

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
    "auth": "sudo"
  }
}
```

### 自定义搭配颜色
- fontSize 字体大小
- iconColor 按钮颜色
- commandDetailColor 指令右侧详情字体颜色
- commandLabelColor 指令字体颜色
- filePathColor 路径字体颜色
- labelColor pkgName字体颜色

![CustomColors](/assets/demo1.gif)

### Dark:
![demo](/assets/dark.gif)

### Light:
![demo](/assets/light.gif)

## :coffee:

[请我喝一杯咖啡](https://github.com/Simon-He95/sponsor)

## License

[MIT](./license)
