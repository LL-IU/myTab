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
};

function remove() {
    sbtn.classList.remove('sbtn-focus')
    itema.classList.remove('item-act');
    itemb.classList.remove('item-act');
    bg.classList.remove('bg-act');
    container.classList.remove('container-focus');
    content = sbtn.value; //点击搜索按钮会丢失聚焦，先保存值，在清除内容
    sbtn.value = ""; //失去焦点清除内容
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

window.onkeydown = function (e) {
    if (e.keyCode === 13) {
        //enter不会让input丢失聚焦，所以要先取值，因为不能执行到remove里的取值
        content = sbtn.value;
        searchMy();
    };
}
//quicklink部分，右键菜单和自定义网址
var ql = document.getElementById("quickLink");//快捷链接的整体
var keytype = document.getElementsByClassName("keytype");//每个链接按钮的样式
let myul = document.querySelector('.myul');//右键菜单
var ulId = document.getElementById("myul");
var myli = document.getElementById("myli");//右键菜单列表项
var linkInput = document.getElementById("linkInput");//右键菜单的链接输入框
var iconInput = document.getElementById("iconInput");//右键图标链接输入框
for (let i = 0; i < keytype.length; i++) {
    const kt = keytype[i];//对应某个链接
    //读取localstorage的缓存
    var kthref = localStorage.getItem(i);
    var ktimg = localStorage.getItem(i + 27);
    if (kthref) {//如果保存了就读取，没有就默认
        kt.href = kthref;
    }
    if (ktimg) {
        var linkImg = document.createElement("img");
        linkImg.src = ktimg;
        kt.appendChild(linkImg);
    }

    kt.addEventListener('contextmenu', fn);
    function fn(e) {
        e.preventDefault();//preventDefault()阻止默认事件（这里阻止了默认菜单）
        myul.style.display = 'block';//点击右键菜单显示出来
        let X = e.screenX;// - this.offsetLeft 
        let Y = e.screenY - 60;//  - this.offsetTop 
        myul.style.left = X + 'px';
        myul.style.top = Y + 'px';
        //kt.classList.add("test");
        //enter后把输入的网址填入a标签的href中，让它能被访问，获取图标
        window.onkeydown = function (e) {
            if (e.keyCode === 13) {
                var newLink = linkInput.value;//获得输入的网址
                var newIcon = iconInput.value;
                kt.href = "https://" + newLink;//为什么要加"https://"，
                //因为不定义href时会自带网页本身的链接，不加就会把输入内容直接填到本身的网址后面，加上后可以替换掉原本的href
                var imgs = kt.getElementsByTagName('img').length;//用于判断是否存在img
                if (imgs == 0) {
                    //没有img时创建一个，放入网址图标
                    var linkImg = document.createElement("img");
                    linkImg.src = "https://" + newIcon;
                    kt.appendChild(linkImg);
                } else {
                    //有img时替换src
                    kt.querySelector("img").src = "https://" + newIcon;//querySelector可以获得img
                }
                myul.style.display = 'none';//输入完消失
                linkInput.value = "";//输入框清空
                iconInput.value = "";
                //把数据存到localStorage
                localStorage.setItem(i, "https://" + newLink);
                localStorage.setItem(i + 27, "https://" + newIcon);
            }
        }
    }
    window.onclick = function (event) {
        //if (event.target.id == "myli") {//可行
        if (event.target.id == "linkInput" || event.target.id == "iconInput" || event.target.id == "myli") {
            //如果点击到输入框或者li上，不会消失
            //好像必须用id才有效
            //myul.classList.add("test");//用于测试if条件是否成立
            myul.style.display = 'block';
            return;
        };
        //myul.classList.remove("test");
        myul.style.display = 'none';
        linkInput.value = "";
        iconInput.value = "";
        //如果点击菜单外的任意位置，菜单被隐藏
    }
}