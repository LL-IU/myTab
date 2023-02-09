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