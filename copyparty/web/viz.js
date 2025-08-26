(function(){
	if (!window.afilt || !window.mp)
	    return;

	var can, ctx, W, H, raf, analyser, buf, mode = '', renders = {};

	function setup(){
	    if (can)
	        return;
	    can = mknod('canvas', 'viz');
            can.style.cssText = 'position:fixed;left:0;bottom:0;width:100%;height:128px;z-index:0;pointer-events:none';
	    QS('body').appendChild(can);
	    ctx = can.getContext('2d');
	    resize();
	    window.addEventListener('resize', resize);
	}

	function resize(){
	    W = can.width = window.innerWidth;
	    H = can.height = can.offsetHeight || 128;
	}

	renders.waterfall = function(){
	    var img = ctx.getImageData(0,0,W,H);
	    ctx.putImageData(img,0,-1);
	    for (var x=0;x<buf.length && x<W;x++){
	        var v = buf[x];
	        ctx.fillStyle = 'hsl(' + (240 - v * 240 / 255) + ',100%,' + (v/255*50+25) + '%)';
	        ctx.fillRect(x,H-1,1,1);
	    }
	};

	renders.bars = function(){
	    ctx.clearRect(0,0,W,H);
	    var bw = W / buf.length;
	    for (var x=0;x<buf.length;x++){
	        var v = buf[x] / 255 * H;
	        ctx.fillStyle = 'hsl(' + (x / buf.length * 240) + ',100%,' + (v/H*50+25) + '%)';
	        ctx.fillRect(x*bw,H-v,bw,v);
	    }
	};

	function draw(){
	    raf = requestAnimationFrame(draw);
	    if (!mp || !mp.au || mp.au.paused)
	        return;
	    analyser.getByteFrequencyData(buf);
	    renders[mode] && renders[mode]();
	}

	function load(){
	    if (!actx || analyser)
	        return;
	    analyser = actx.createAnalyser();
	    buf = new Uint8Array(analyser.frequencyBinCount);
	    afilt.filters.push(analyser);
	    setup();
	    draw();
	}

	function unload(){
	    if (analyser)
	        analyser.disconnect();
	    analyser = null;
	    cancelAnimationFrame(raf);
	    raf = 0;
	    if (can){
	        window.removeEventListener('resize', resize);
	        qsr('#viz');
	        can = ctx = null;
	    }
	}

	var plug = {
	    en:false,
	    load:function(){
	        if (mode)
	            load();
	    },
	    unload:unload,
	    set:function(m){
	        mode = m;
	        this.en = !!m;
	        if (!m)
	            unload();
	    }
	};

	var st = window.sread ? sread('au_viz') : '';
	if (st && st !== 'off'){
	    mode = st;
	    plug.en = true;
	}
	window.viz = plug;
	afilt.plugs.push(plug);
})();
