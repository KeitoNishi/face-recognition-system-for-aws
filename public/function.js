// JavaScript Document

$('a[href="#"]').on("click",function(event) {
  event.preventDefault();
});

/***** ページトップ *****************************************************************************/
$(document).ready(function() {
	var flag = false;
	var pagetop = $('#pagetop');
	$(window).scroll(function () {
		if ($(this).scrollTop() > 100) {
			if (flag == false) {
				flag = true;
				pagetop.stop().animate({
					'bottom': '10px'
				}, 200);
			}
		} else {
			if (flag) {
				flag = false;
				pagetop.stop().animate({
					'bottom': '-110px'
				}, 200);
			}
		}
	});
	pagetop.on("click",function () {
		$('body, html').animate({ scrollTop: 0 }, 300);
		return false;
	});
});


$("#gallery > div > a").modaal({
  overlay_close:true,//モーダル背景クリック時に閉じるか
  before_open:function(){// モーダルが開く前に行う動作
    $('html').css('overflow-y','hidden');/*縦スクロールバーを出さない*/
  },
  after_close:function(){// モーダルが閉じた後に行う動作
    $('html').css('overflow-y','scroll');/*縦スクロールバーを出す*/
  }
});
