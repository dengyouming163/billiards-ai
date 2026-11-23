# android-serialport
###   uniappx/uniapp  demo 亲测可用 
###   长期维护 有任何问题 可在群中联系
###   uniapp demo 在例子项目下的 zip 文件
#### 插件测试使用方法
1. 选择试用，绑定要试用的项目appid，

2. 选择后下载到对应的本地项目，

3. 按照文档 -》把插件引入项目（即 import {SerialPortHelper} from "@/uni_modules/android-serialport"; 需要先引入），

4. 发布-》云打包-》选择制作基座-》打包等基座制作完成 

5. 运行 -》 运行到手机或模拟器-》运行到Androidapp基座-》选择使用自定义基座运行-》选择手机-》运行
### uni-app x项目（uvue）中调用示例：（调试需要自定义基座）

```
import {SerialPortHelper} from "@/uni_modules/android-serialport";

var helper=new SerialPortHelper();
// var array=[] as string[];
// array=helper.getAllDevices() // 获取串口列表

helper.setPath("/dev/ttyS7");
helper.setBaudrate(9600);
//一般默认
// helper.dataBits(8);
// helper.parity(0);
// helper.stopBits(1);
// helper.flags(0)
var state=	helper.open();
if(state){
	helper.onStartAutoReadData(function(res:number[]){
				// console.log(res[0])
			console.log(helper.byte2HexString(res))
	})
	// var b:ByteArray=new ByteArray(5);
	// b[0]=0x55;
	// b[1]=0x00;
	// b[2]=0x12;
	// b[3]=0x00;
	// b[4]=0x7B;
	// helper.sendData(b)
	
	helper.sendDataString("550120057B")
	
	//停止自动接收
	// helper.stopReadPortData();
	
	//关闭串口
	// helper.close()
}
			
```


### uni-app 项目（vue  nvue）中调用示例：（调试需要自定义基座）

 ```
import {SerialPortHelper} from "@/uni_modules/android-serialport";


	var helper=new SerialPortHelper();
// console.log(helper.getAllDevices())		
	helper.setPath("/dev/ttyS7");
	helper.setBaudrate(9600);
	var state=	helper.open();
	if(state){
		helper.onStartAutoReadData(function(res){
			console.log(helper.uint8ArrayToHexString(res))
		})
		var b=new Uint8Array(5);
		b[0]=0x55;
		b[1]=0x00;
		b[2]=0x12;
		b[3]=0x00;
		b[4]=0x7B;
		helper.sendDataUnit8Array(b)
		//helper.sendDataString("550120057B")		
	}
	
```

### 开发文档



### 获取设备列表
#### getAllDevice()
return 串口列表
uniappx
~~~
 var portList:string[]=helper.getAllDevice()
~~~

uniapp
~~~
 var portList=helper.getAllDevice()
~~~

###  设置串口参数
 setPath  设置路径
 ~~~
 helper.setPath("/dev/ttyS7");
 ~~~
####  
setBaudrate  设置波特率
~~~
helper.setBaudrate(9600);
~~~
####  
 dataBits 数据位   默认8,可选值为5~8
 ~~~
  helper.dataBits(8);
 
 ~~~
####  
 parity  校验位 parity 0:无校验位(默认)；1:奇校验位
 ~~~
  helper.parity(0);
 
 ~~~
 
###  
stopBits   停止位   stopBits 默认1；1:1位停止位；2:2位停止位
~~~
 helper.stopBits(1);
~~~
###  
flags   标志  flags 默认0
~~~

 helper.flags(0)
~~~

		
### 打开串口
 
#### open   需要调用才可打开
return  返回是否打开成功
 
 ~~~
 var open= helper.open()
 ~~~
 
#### isOpen
return  返回是否打开成功
 ~~~
 var open= helper.isOpen()
 ~~~

### 关闭串口
close
 ~~~
 var open= helper.close()
 ~~~



### 开启自动读取串口数据，需要先打开串口
#### onStartAutoReadData
 回调读取的数据
 uniappx
 ~~~
helper.onStartAutoReadData(function(res:number[]){
	console.log(helper.byte2HexString(res))
})
 ~~~
 uniapp
 ~~~
 helper.onStartAutoReadData(function(res){
 	console.log(helper.byte2HexString(res))
 })
  ~~~

### 关闭自动读取串口数据 
#### stopReadPortData
 ~~~
helper.stopReadPortData()
 ~~~

### 手动读取串口数据  手动读取之前需先打开串口 且不可和自动读串口数据同时调用
#### available()
return 返回-1 表示无可读数据  其它为可读数据长度
~~~
 var len= helper.available()
~~~


#### onReadData
参数1 需要读取数据的长度  number
参数2  开始读取位置  number
参数3 读取数据结束位置 number
参数4  回调读取的数据function  数据类型为number[] 
uniappx
~~~
  helper.onReadData(10,0,10,function(b:number[]){
	 
 })
~~~

uniapp
~~~
 helper.onReadData(10,0,10,function(b){
	 
 })
~~~



### 发送数据 
#### sendData  (uniappx)
参数1  需要发送的ByteArray
~~~
 	var b:ByteArray=new ByteArray(5);
 	b[0]=0x55;
 	b[1]=0x00;
 	b[2]=0x12;
 	b[3]=0x00;
	b[4]=0x7B;
 	helper.sendData(b)
~~~

#### sendDataString()
参数1  string 类型的16进制的字符串 例如 "550120057B"

~~~
 helper.sendDataString("550120057B")
~~~

#### sendDataUnit8Array  (uniapp)
~~~
var b=new Uint8Array(5);
		b[0]=0x55;
		b[1]=0x00;
		b[2]=0x12;
		b[3]=0x00;
		b[4]=0x7B;
		helper.sendDataUnit8Array(b)
~~~

### 辅助转换方法

### 将16进制字符串转换为ByteArray (uniappx)
#### parseHexStr2Byte 
参数1 为16进制字符串
~~~
var by =	helper.parseHexStr2Byte("55 66 a1")
~~~

### ByteArray转换成16进制字符串
#### byte2HexString
参数1 ByteArray
~~~
var b:ByteArray=new ByteArray(5);
 	b[0]=0x55;
 	b[1]=0x00;
 	b[2]=0x12;
 	b[3]=0x00;
	b[4]=0x7B;
var by =	helper.byte2HexString(b)
~~~


### 字符转16进制拼接字符
### string2ByteStrWithCharset
参数1 普通文本
 
参数2  传utf-8 gbk
~~~
var hex=helper.string2ByteStrWithCharset("测试","utf-8")
~~~

### 进制拼接字符转文本
### byte2StringWithCharset
参数1 16进制拼接字符 

参数2  传utf-8 gbk
~~~
var  text=helper.string2ByteStrWithCharset("E6B58BE8AF95","utf-8")
~~~




### ByteArray 辅助操作方法
#### 将两个ByteArray进行合并

#### addBytes
参数1 合并ByetArray 1 
参数2 合并ByetArray 2
return 合并后的ByetArray 



#### 将ByteArray进行剪切

#### subBytes
参数1 需要剪切的  ByetArray 
参数2 开始位置 类型number
参数3  需要剪切的长度   number   
return 剪切后的ByetArray 
	
#### js Unit8Array 转为String 
#### uint8ArrayToHexString
参数1 Unit8Array

return String
	
 
