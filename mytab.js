var searchBtn = document.querySelector('.search-btn');//搜索框
var style1 = document.createElement('style');
var timeBox = document.querySelector('.timeBox');//时间
var container = document.getElementById("container");//包含搜索框和搜索图标
var sbtn = document.getElementById("search-btn");
var itema = document.getElementById("itema");//搜索框前后的图标
var itemb = document.getElementById("itemb");
var bg = document.getElementById("bg");//背景
var content = sbtn.value;
sbtn.focus(); //不用autofocus，不好用

//focus和非focus时添加和去除各种css属性
function add() {
    sbtn.classList.add('sbtn-focus');
    itema.classList.add('item-act');
    itemb.classList.add('item-act');
    bg.classList.add('bg-act');
    container.classList.add('container-focus');
    var contlate = sbtn.value;
    if (contlate == "") {
        oUl.style.display = 'none';//切别的页面再回来防止搜索框空了联想词还在
    }
};
var relevance = document.getElementById('relevance');
function remove() {
    sbtn.classList.remove('sbtn-focus')
    itema.classList.remove('item-act');
    itemb.classList.remove('item-act');
    bg.classList.remove('bg-act');
    container.classList.remove('container-focus');
    content = sbtn.value; //点击搜索按钮会丢失聚焦，先保存值，在清除内容
    window.onclick = function (event) {
        if (event.target.id == relevance) {
            oUl.style.display = 'block';
        } else {
            oUl.style.display = 'none';//隐藏联想词
        }
    }
    sbtn.value = ""; //失去焦点清除内容
    //oUl.style.display = 'none';//隐藏联想词
};

//获得时间
setInterval(function () {
    var date = new Date()
    let hh = padZero(date.getHours())
    let mm = padZero(date.getMinutes())
    //let ss = padZero(date.getSeconds())
    timeBox.innerText = hh + ':' + mm; /* + ':' + ss */
}, 1000);

function padZero(n) {
    return n > 9 ? n : '0' + n
};

//搜索事件
function searchMy() {
    /* sbtn.focus(); */
    var url = "https://www.baidu.com/s?ie=utf-8&word=" + content;
    window.open(url);
}

function myClick() {
    /* sbtn.focus(); */
    searchMy();
}
//获取联想词
//输入框
var oInp = document.getElementsByTagName('input')[0];
//得到的数据存在ul的li里
var oUl = document.getElementsByTagName('ul')[0];
//获取输入内容，查找百度对应的src
oInp.oninput = function () {
    var value = this.value;
    var oScript = document.createElement('script');
    oScript.src = 'https://sp0.baidu.com/5a1Fazu8AA54nxGko9WTAnF6hhy/su?wd=' + value + '&cb=doJosn';
    document.body.appendChild(oScript);
    //输入框退格至清空的时候，隐藏联想词
    if (value == "") {
        oUl.style.display = 'none';
    }
}
//对传回的数据进行处理（回调函数）
function doJosn(data) {
    var s = data.s;
    var str = '';
    if (s.length > 0) {
        s.forEach(function (ele, index) {
            str += '<li><a href =https://sp0.baidu.com/s?wd=' + ele + '>' + '<p>' + ele + '</p>' + '</a></li>';
        })
        oUl.innerHTML = str;
        oUl.style.display = 'block';
        var oA = document.getElementsByTagName('a');
        for (let i = 0; i < oA.length; i++) {
            oA[i].target = '_blank';//让联想词的链接在新标签页打开
        }
    } else {
        oUl.style.display = 'none';
    }
}

var keyArray = [81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 65, 83, 68, 70, 71, 72, 74, 75, 76, 90, 88, 67, 86, 66, 78, 77];//按键盘排布的按键代码
//在右键keytype后会停留在fn里，所以需要在那里也加入以下的按键事件，并添加一定的条件
window.onkeydown = function (e) {
    for (let i = 0; i < keytype.length; i++) {
        if (sbtn != document.activeElement) {
            if (e.keyCode === keyArray[i]) {//按下对应按键并且搜索框没有焦点
                keytype[i].click();//点击对应i的链接
            }
        }
    }
    if (sbtn == document.activeElement) {//搜索框有焦点
        if (e.keyCode == 27) {
            sbtn.blur();//去焦点
            oUl.style.display = 'none';//esc时隐藏
        }
        if (e.keyCode == 13) {//enter进行搜索
            //enter不会让input丢失聚焦，所以要先取值，因为不能执行到remove里的取值
            content = sbtn.value;
            searchMy();
            oUl.style.display = 'none';
        };
    } else {
        if (e.keyCode == 27) {
            sbtn.focus();//没有焦点时获得焦点
        }
    }

}
//quicklink部分，右键菜单和自定义网址
var ql = document.getElementById("quickLink");//快捷链接的整体
var keytype = document.getElementsByClassName("keytype");//每个链接按钮的样式
let myul = document.querySelector('.myul');//右键菜单
var ulId = document.getElementById("myul");
var myli = document.getElementById("myli");//右键菜单列表项
var linkInput = document.getElementById("linkInput");//右键菜单的链接输入框
var iconInput = document.getElementById("iconInput");//右键图标链接输入框
var iconSelect = document.getElementById("iconSelect");
for (let i = 0; i < keytype.length; i++) {
    const kt = keytype[i];//对应某个链接
    var imgs = kt.getElementsByTagName('img').length;//用于判断是否存在img
    //读取localstorage的缓存
    var kthref = localStorage.getItem(i);
    var ktimg = localStorage.getItem(i + 27);
    var ktis = localStorage.getItem(i + 54);
    if (kthref) {//如果保存了就读取，没有就默认
        kt.href = kthref;
    }
    if (ktis) {
        var linkImg = document.createElement("img");
        kt.appendChild(linkImg);
        linkImg.src = ktis;
    } else if (ktimg) {
        var linkImg = document.createElement("img");
        kt.appendChild(linkImg);
        linkImg.src = ktimg;
    }
    kt.addEventListener('contextmenu', fn);
    function fn(e) {
        e.preventDefault();//preventDefault()阻止默认事件（这里阻止了默认菜单）
        myul.style.display = 'block';//点击右键菜单显示出来
        let X = e.pageX;
        let Y = e.pageY;
        myul.style.left = X + 'px';
        myul.style.top = Y + 'px';
        linkInput.focus();
        //kt.classList.add("test");
        //enter后把输入的网址填入a标签的href中，让它能被访问，获取图标
        //这里右键之后，只能监听到以下的onkeydown，需要把前面对搜索框的操作也添加到这里
        window.onkeydown = function (e) {
            if (myul.style.display == 'block') {
                //var e = window.event || event;
                if (e.keyCode == 40) {//左37，上38，右39，下40
                    linkInput.blur();
                    iconInput.focus();
                }
                if (e.keyCode == 38) {
                    iconInput.blur();
                    linkInput.focus();
                }
                if (e.keyCode == 27) {//esc
                    myul.style.display = 'none';
                }
                if (e.keyCode == 13) {//enter
                    var newLink = linkInput.value;//获得输入的网址
                    var newIcon = iconInput.value;//可以使用本地图片
                    kt.href = newLink;
                    //输入时要加https://或http://
                    //为什么要加"https://"，
                    //因为不定义href时会自带网页本身的链接，不加就会把输入内容直接填到本身的网址后面，加上后可以替换掉原本的href
                    if (imgs == 0) {
                        //没有img时创建一个，放入网址图标
                        // var linkImg = document.createElement("img");
                        if (newIcon != '') {
                            var linkImg = document.createElement("img");
                            kt.appendChild(linkImg);
                            linkImg.src = newIcon;
                        }
                    } else {
                        //有img时替换src
                        kt.querySelector("img").src = newIcon;//querySelector可以获得img
                    }
                    myul.style.display = 'none';//输入完消失
                    linkInput.value = "";//输入框清空
                    iconInput.value = "";
                    //把数据存到localStorage
                    if (newLink || newIcon) {
                        localStorage.setItem(i, newLink);
                        localStorage.setItem(i + 27, newIcon);
                    }
                    if (newLink == "c") {//在网址栏输入clear可以清除掉这里存储的网址
                        localStorage.removeItem(i);
                        localStorage.removeItem(i + 27);
                        localStorage.removeItem(i + 54);
                    }
                }
            }
            if (myul.style.display == 'none') {
                for (let i = 0; i < keytype.length; i++) {
                    if (sbtn != document.activeElement) {
                        if (e.keyCode === keyArray[i]) {//按下对应按键并且搜索框没有焦点
                            keytype[i].click();//点击对应i的链接
                        }
                    }
                }
                if (sbtn == document.activeElement) {//搜索框有焦点
                    if (e.keyCode == 27) {
                        sbtn.blur();//去焦点
                    }
                    if (e.keyCode == 13) {//enter进行搜索
                        //enter不会让input丢失聚焦，所以要先取值，因为不能执行到remove里的取值
                        content = sbtn.value;
                        searchMy();
                    };
                } else {
                    if (e.keyCode == 27) {
                        sbtn.focus();//没有焦点时获得焦点
                    }
                }
            }
        }
        //加入联想词后，用此方法
        window.onclick = function (event) {
            if (linkInput != document.activeElement && iconInput != document.activeElement) {
                myul.style.display = 'none';
                linkInput.value = "";
                iconInput.value = "";
            }
            //如果点击菜单外的任意位置，菜单被隐藏
        }

        iconSelect.addEventListener('change', readFile, false); //如果支持就监听改变事件，一旦改变了就运行readFile函数。
        function readFile() {
            if (imgs == 0) {
                var file = this.files[0]; //获取file对象
                //判断file的类型是不是图片类型。
                if (!/image\/\w+/.test(file.type)) {
                    alert("文件必须为图片！");
                    return false;
                }
                var reader = new FileReader(); //声明一个FileReader实例
                reader.readAsDataURL(file); //调用readAsDataURL方法来读取选中的图像文件
                //最后在onload事件中，获取到成功读取的文件内容，并以插入一个img节点的方式显示选中的图片
                reader.onload = function (e) {
                    var linkImg = document.createElement("img");
                    kt.appendChild(linkImg);
                    linkImg.setAttribute('src', this.result);
                    localStorage.setItem(i + 54, this.result);

                }
            }
        }
    }
}
//右键修改背景
var bgChangeMenu = document.getElementById("bgChangeMenu");
var bgSelect = document.getElementById("bgSelect");
var bghref = localStorage.getItem(-1);
if (bghref) {
    bg.setAttribute('src', bghref);
}
bg.addEventListener('contextmenu', bgChange);
function bgChange(e) {
    e.preventDefault();
    bgChangeMenu.style.display = 'block';
    let X = e.pageX;
    let Y = e.pageY;
    bgChangeMenu.style.left = X + 'px';
    bgChangeMenu.style.top = Y + 'px';

    window.onclick = function (e) {
        if (bgSelect != document.activeElement) {
            bgChangeMenu.style.display = 'none';
        }
    }
    bgSelect.addEventListener('change', readFile, false); //运行readFile函数。
    function readFile() {
        var file = this.files[0]; //获取file对象
        //判断file的类型是不是图片类型。
        if (!/image\/\w+/.test(file.type)) {
            alert("文件必须为图片！");
            return false;
        }
        var reader = new FileReader(); //声明一个FileReader实例
        reader.readAsDataURL(file); //调用readAsDataURL方法来读取选中的图像文件
        //最后在onload事件中，获取到成功读取的文件内容，并以插入一个img节点的方式显示选中的图片
        reader.onload = function (e) {
            bg.setAttribute('src', this.result);
            // localStorage.removeItem(-1);
            localStorage.setItem(-1, this.result);
        }
    }
}
function bgClear() {
    bg.setAttribute('src', 'bg.jpg');
    localStorage.removeItem(-1);
}