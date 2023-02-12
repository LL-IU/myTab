var searchBtn = document.querySelector('.search-btn');
var style1 = document.createElement('style');
var timeBox = document.querySelector('.timeBox');
var container = document.getElementById("container");
var sbtn = document.getElementById("search-btn");
var itema = document.getElementById("itema");
var itemb = document.getElementById("itemb");
var bg = document.getElementById("bg");
var content = sbtn.value;
sbtn.focus(); //不用autofocus，不好用

//focus和非focus时各种css属性
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
var ql = document.getElementById("quickLink");
var keytype = document.getElementsByClassName("keytype");
let myul = document.querySelector('.myul');
var ulId = document.getElementById("myul");
var myli = document.getElementById("myli");
var linkInput = document.getElementById("linkInput");
var iconInput = document.getElementById("iconInput");
for (let i = 0; i < keytype.length; i++) {
    const kt = keytype[i];
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
                var newLink = linkInput.value;
                var newIcon = iconInput.value;
                kt.href = "https://" + newLink;
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
                myul.style.display = 'none';
                linkInput.value = "";
                iconInput.value = "";
            }
        }
    }
    window.onclick = function (event) {
        //if (event.target.id == "myli") {//可行
        if (event.target.id == "linkInput" || event.target.id == "iconInput" || event.target.id == "myli") {
            //如果点击到输入框或者li上，不会消失
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
/* ql.addEventListener('contextmenu', fn); */
//contextmenu右键
/* function fn(e) {
    e.preventDefault();//preventDefault()阻止默认事件（这里阻止了默认菜单）
    myul.style.display = 'block';//点击右键菜单显示出来
    let X = e.screenX;// - this.offsetLeft
    let Y = e.screenY - 60;//  - this.offsetTop
    myul.style.left = X + 'px';
    myul.style.top = Y + 'px';
} */