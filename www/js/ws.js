var sockets = [null, null, null, null];

function connect(booth) {
	var uri = "ws://localhost:700" + booth;
	//var uri = "ws://exp" + (booth + 1) + "-cogworks.cogsci.rpi.edu:9000";
	var ws = new WebSocket(uri);
	console.debug("[Booth " + (booth + 1) + "] CONNECT: " + uri);
	ws.addEventListener("open", this.onOpen.bind(null, booth));
	ws.addEventListener("close", this.onClose.bind(null, booth));
	ws.addEventListener("message", this.onMessage.bind(null, booth));
	ws.addEventListener("error", this.onError.bind(null, booth));
	sockets[booth] = ws;
}

function disableSliderTrack($slider) {
	$slider.bind("mousedown", function(event) {
		return isTouchInSliderHandle($(this), event);
	});
	$slider.bind("touchstart", function(event) {
		return isTouchInSliderHandle($(this), event.originalEvent.touches[0]);
	});
}

function init() {
	for (var i = 0; i < 4; i++) {
		$('<input>').appendTo('[ data-role="booth' + i + '_slider"]').attr({
			'name' : 'slider-mini',
			'id' : 'booth' + i + '_slider',
			'data-highlight' : 'true',
			'min' : '0',
			'max' : '100',
			'value' : '50',
			'type' : 'range'
		}).slider({
			create : function(event, ui) {
				$(this).parent().find('input').hide();
				$(this).parent().find('input').css('margin-left', '-9999px');
				$(this).parent().find('.ui-slider-track').css('margin', '0 15px 0 15px');
				$(this).parent().find('.ui-slider-handle').hide();
			}
		}).slider("disable").slider("refresh");
		connect(i);
	}
	$('#navScroller').unbind('mousedown');
}

function setBooth(booth, title, timestamp, name, eid, trial) {
	booth_title = document.getElementById("booth" + booth + "_title");
	subject_name = document.getElementById("booth" + booth + "_subjectName");
	subject_eid = document.getElementById("booth" + booth + "_subjectEID");
	timeA = document.getElementById("booth" + booth + "_timeA");
	timeB = document.getElementById("booth" + booth + "_timeB");
	timeC = document.getElementById("booth" + booth + "_timeC");
	slider = document.getElementById("booth" + booth + "_slider");
	date = moment.unix(timestamp);
	if (title) {
		booth_title.innerHTML = " (" + title + ")";
		subject_name.innerHTML = name;
		subject_eid.innerHTML = eid;
		timeA.innerHTML = date.format("h:mm");
		timeB.innerHTML = date.format(" A");
		timeC.innerHTML = " | " + date.startOf('minute').fromNow();
		slider.innerHTML = "asasdasdsa";
		progress = $("#booth" + booth + "_slider");
		progress.val(trial[0] / trial[1] * 100);
		progress.slider("refresh");
	} else {
		booth_title.innerHTML = "";
		subject_name.innerHTML = "";
		subject_eid.innerHTML = "";
		timeA.innerHTML = "";
		timeB.innerHTML = "";
		timeC.innerHTML = "";
	}
}

function resetBooth(booth) {
	setBooth(booth, null, null, null, null);
}

function onOpen(booth, evt) {
	console.debug("[Booth " + (booth + 1) + "] CONNECTED");
	sockets[booth].send("status");
}

function onClose(booth, evt) {
	console.debug("[Booth " + (booth + 1) + "] DISCONNECTED");
	sockets[booth] = null;
	resetBooth(booth);
	setTimeout(connect.bind(null, booth), 5000);
}

function onMessage(booth, evt) {
	console.log(evt.data);
	var status = JSON.parse(evt.data);
	setBooth(booth, status['experiment'], status['timestamp'], status['subject_name'], status['subject_eid'], status['trial']);
}

function onError(booth, evt) {
	console.debug("[Booth " + (booth + 1) + "] ERROR: " + evt.data);
	resetBooth(booth);
	setTimeout(connect.bind(null, booth), 5000);
}
