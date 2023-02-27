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
                    if (newLink || newIcon) {
                        localStorage.setItem(i, "https://" + newLink);
                        localStorage.setItem(i + 27, "https://" + newIcon);
                    }
                    if (newLink == "clear") {//在网址栏输入clear可以清除掉这里存储的网址
                        localStorage.removeItem(i);
                        localStorage.removeItem(i + 27);
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