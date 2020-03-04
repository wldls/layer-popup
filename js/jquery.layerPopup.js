(function($){
	var defaults = {
		dim:'.dimmed',
		popMove: false,
		popMany: false,
		// popCenter:false,
		popClose:false,
		popCls:'.popup',
		popActive:'.on',
		popAttr:'data-idx',
		popIdx:1,
		popMoveHandleCls:'.pop_head',
		windowScroll:{top:0, left:0},
		beforeOpen: function(e){},
		afterOpen: function(e){}
	}

	function Plugin(element, options){
		this.w = $(document);
		this.e = $(element);		
		// this.options = $.extend({}, defaults, options);
		this.options = $.extend({}, defaults, options, arguments[0] || {});
		this.init();
	}

	Plugin.prototype = {
		init: function(){
			var that = this,
				opt = that.options;

			if(opt.popClose){
				// 팝업 닫기 기능만 사용하는 경우			
				that.popCloseEvent();
				return false;
			}

			// 팝업 열기
			that.popOpenEvent();

			// 윈도우 사이즈 변경될때마다 계속 팝업 가운데로 조정
			$(window).on('resize', _.throttle(function(){
				that.popCenterEvent();
			}, 300));

			// draggable 실행
			if(opt.popMove) that.popMoveEvent();

			// 팝업을 여러 개 띄우는 경우
			if(opt.popMany) that.popManyEvent();
		},
		popOpenEvent:function(e){
			var that = this,
				opt = that.options,
				$element = that.e;

			// 팝업 열기 전에 함수 불러오기
			opt.beforeOpen.call(this, e);

			if(!opt.popMany && $('.popup.on').length > 0){
				// 이미 노출되어있는 팝업 노출해제
				that.popCloseEvent('.popup.on');
			}

			if(!opt.popMove){
				// 일반 팝업인 경우 popCenterEvent을 나중에 선언
				$element.addClass('on').attr(opt.popAttr, opt.popIdx);
				$(opt.dim).addClass('on');
				that.popCenterEvent();

				// 드래그 가능한 팝업이 아니면서 브라우저 스크롤이 있는 경우에만 브라우저 스크롤 숨기기
				if($(this.w).height() > $(window).height()){
					// 스크롤 위치는 그대로
					opt.windowScroll.top = $(window).scrollTop();
					opt.windowScroll.left = $(window).scrollLeft();

					// 스크롤바 숨기기
					$('body, html').addClass('layer_open');

					// body에 overflow:hidden할 경우 scrollTop이 0으로 되는 현상 수정
					$('#wrap').css({'top':-opt.windowScroll.top, 'left': -opt.windowScroll.left});
				}
			}else if(opt.popMove){
				// 드래그 가능한 팝업의 경우 popCenterEvent을 우선 선언
				that.popCenterEvent();
				$element.addClass('on').attr(opt.popAttr, opt.popIdx);
			}

			// 팝업 연 후 함수 불러오기
			opt.afterOpen.call(this, e);
		},
		popCenterEvent:function(){			
			var that = this,
				opt = that.options,
				$element = that.e,
				wrapTop = Math.abs($('#wrap').css('top').replace('px','')),
				wrapLeft = Math.abs($('#wrap').css('left').replace('px','')),
				scrollTop = $(window).scrollTop(),
				scrollLeft = $(window).scrollLeft(),
				winWidth = $(window).outerWidth(),
				winHeight = $(window).outerHeight(),
				hasOn = $element.hasClass('on'),
				isMove = opt.popMove;

			// resize가 되어도 scrollTop, scrollLeft값 유지
			if(wrapTop > 0){
				scrollTop = wrapTop;
			}else if(wrapLeft > 0){
				scrollLeft = wrapLeft;
			}

			var centX = (winWidth - $element.outerWidth())/2 + scrollLeft,
				centY = (winHeight - $element.outerHeight())/2 + scrollTop;
			
			if(hasOn && !isMove){
				// on되어있는 팝업 중 드래그 팝업이 아닌 경우만 resize시 center 정렬
				$element.css({top:centY+'px', left:centX+'px'});

			}else if(!hasOn && isMove){
				// 드래그 팝업은 처음 노출 시에만 center 정렬
				$element.css({top:centY+'px', left:centX+'px'});
			}
		},
		popMoveEvent:function(){
			var that = this,
				opt = that.options,
				$element = that.e;

			$element.draggable({
				handle: opt.popMoveHandleCls,
				revert:function(){
					// dualpop이 화면 바깥으로 벗어나면 원위치
					var $popBox = $(this),
						popWidth = $popBox.outerWidth(),
						posTop = $popBox.offset().top,
						posLeft = $popBox.offset().left,
						posRight = posLeft + popWidth,						
						popHead = $('.pop_head').outerHeight() - 10;

					// 팝업이 window를 넘을 경우 원위치
					if(-popHead > posTop || 0 > posRight){
						return true;
					}
				}
			});
		},
		popCloseEvent: function(el){
			var that = this,
				opt = that.options,
				$element = that.e,
				$popOn = $(opt.popCls + opt.popActive),
				$dimmed = $(opt.dim);

			if(el !== undefined){
				// 열려 있는 팝업 닫기
				$(el).removeClass('on').removeAttr(opt.popAttr);
			}else{
				// 해당 팝업 닫기
				$element.removeClass('on').removeAttr(opt.popAttr);
			}

			// 해당 팝업 닫기
			// $element.removeClass('on').removeAttr(opt.popAttr);

			if(!$popOn.hasClass('ui-draggable') && $popOn.length > 1){
				// 드래그 팝업이 아니면서 팝업 위에 팝업이 있는 경우에는 dimmed data-idx값만 삭제
				$dimmed.removeAttr(opt.popAttr);
			}else{
				$dimmed.removeClass('on').removeAttr(opt.popAttr);
			}
			
			//숨긴 스크롤바 보이기
			if($('body').hasClass('layer_open')){
				$('body, html').removeClass('layer_open');
				$('#wrap').removeAttr('style');

				$(window).scrollTop(opt.windowScroll.top).scrollLeft(opt.windowScroll.left);
			}
		},
		popManyEvent:function(){
			var that = this,
				opt = that.options,
				$element = that.e;

			// 팝업을 여러개 노출하는 경우 data-idx attribute를 설정하여 z-index 제어
			$element.attr(opt.popAttr, opt.popIdx);
			$(opt.dim).attr(opt.popAttr, opt.popIdx);
		}
	}

	$.fn.layerPop = function(options){
		return this.each(function(){			
			var plugin = new Plugin(this, options);
		});
	};
}(jQuery));