## How to use?

相比起锁子哥的js，此脚本更适用于电脑基础比较差的小白
### 1. 安装

只需要下载main.py和config.txt和requirement.txt即可
放在同一个文件夹内，按win+R，输入cmd，输入 pip install -r requirement.txt即可完成配置

### 2. 配置

打开config.txt，输入你的账号密码，以及你想要的课程。

[mysql]
#学号
username=

#密码
password=

kcid=

jx0404id=

#0是主选 其他是公选
cno=0
#刷新时间，搞太快封号结果自负
cd=10


### 3. 运行

建议在pycharm等可看见结果的平台运行

### 4. 注意

右键要选的课的选课按钮，点击检查，会出现如下代码
<img width="460" alt="8e8701f618a6830723a4cb18663b19b" src="https://user-images.githubusercontent.com/50409074/221087370-ef506f39-77e5-4636-b7bb-01bbbe4c765d.png">

长串数字的是jxid，别搞混了
<img width="1118" alt="d0ca5b8f062d8b90b0c92d68a6e2616" src="https://user-images.githubusercontent.com/50409074/221087913-3e551be7-2b06-4724-9f43-5400b1466e46.png">

或者在点击选课之前按f12，点击网络，点击选课，会出现get请求，按照请求网址上的id填写即可
<img width="427" alt="1fbf2105509a4074a275fb475f5a1ca" src="https://user-images.githubusercontent.com/50409074/221088301-2cb47b23-b71a-4150-b165-e9bd9fdb97ab.png">

kcid=FD00014&cfbs=null&jx0404id=202220232002211&xkzy=&trjf=
运行结果：
![image](https://user-images.githubusercontent.com/50409074/221088389-a65abac6-7302-4da8-89ce-bee2f345c05a.png)
