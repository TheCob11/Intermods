var canvas = document.getElementById("graphCanvas");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
var ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
class FreqItem {
	constructor(name, freq) {
		this.freq = freq;
		this.name = name;
	}
	draw() {
		ctx.save();
		ctx.fillStyle = this.color;
		this.x = (this.freq - this.macro.range.start) * (canvas.width / this.macro.range.length);
		this.y = canvas.height - this.height;
		ctx.fillRect(this.x, this.y, this.width, this.height);
		if (this.hovered) {
			ctx.textBaseline = "bottom";
			ctx.fillText(`${this.freq}MHz - ${this.name}`, this.x, this.y)
		}
		ctx.restore();
	}
}
class Microphone extends FreqItem {
	constructor(name, freq) {
		super(name, freq);
		this.color = "blue";
		this.height = canvas.height * 4 / 5;
		this.width = 1;
	}
}
class FreqRange {
	constructor(start = 450, end = 600) {
		this.start = start;
		this.end = end;
	}
	get length() {
		return this.end - this.start
	}
}
class Intermod extends FreqItem { //uh oh
	constructor(freq, order, parents, macro) {
		super(`${parents[0].name} + ${parents[1].name}`, freq);
		this.order = order
		this.parents = parents
		this.macro = macro;
		this.width = 1;
	}
}
class Inter3rd extends Intermod {
	constructor(freq, parents, macro) {
		super(freq, 3, parents, macro);
		this.color = "red";
		this.height = canvas.height * 2 / 5

	}
}
class Inter5th extends Intermod {
	constructor(freq, parents, macro) {
		super(freq, 5, parents, macro);
		this.color = "green";
		this.height = canvas.height * 1 / 5
	}
}
class Macrophone { //group of microphones
	constructor(mics, range = new FreqRange()) {
		this.mics = [];
		this.intermods = [];
		for (var i of mics) {
			this.addMic(i);
		}
		this.range = range;
	}
	addMic(mic) {
		this.mics.push(mic);
		mic.macro = this;
		this.calcIntermods();
	}
	addIntermod(intermod) {
		this.intermods.push(intermod);
		intermod.macro = this;

	}
	graph() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		for (var i of this.mics) {
			i.draw();
		}
		for (var i of this.intermods) {
			i.draw();
		}
		window.requestAnimationFrame(() => this.graph());
	}
	calcIntermods() {
		for (var i of this.mics) {
			for (var j of this.mics.filter(e => e != i)) {
				/*
				[3rd order] = (2•F1)-F2
				[3rd order] = (2•F2)-F1
				[3rd order] = (2•F1)+F2
				[3rd order] = (2•F2)+F1
				[3rd order] = 3•F1
				[3rd order] = 3•F2
				[5th order] = (3•F1)+(2•F2)
				[5th order] = (3•F2)+(2•F1)
				[5th order] = (3•F1)-(2•F2)
				[5th order] = (3•F2)-(2•F1)
				*/
				var f1 = i.freq;
				var f2 = j.freq;
				for (var k of [2 * f1 - f2, 2 * f2 - f1, 2 * f1 + f2, 2 * f2 + f1, 3 * f1, 3 * f2]) {
					if (!this.intermods.some(e => e.freq == k)) {
						this.addIntermod(new Inter3rd(k.toFixed(3), [i, j], this))
					}
				}
				for (var k of [3 * f1 + 2 * f2, 3 * f2 + 2 * f1, 3 * f1 - 2 * f2, 3 * f2 - 2 * f1]) {
					if (!this.intermods.some(e => e.freq == k)) {
						this.addIntermod(new Inter5th(k.toFixed(3), [i, j], this))
					}
				}
			}
		}
	}
}

var test1 = new Microphone("A1", 518.750);
var test2 = new Microphone("A2", 537.65);
var test3 = new Microphone("A3", 535.4);
var test4 = new Microphone("U6", 572);
var macro = new Macrophone([test1, test2, test3, test4]);
macro.graph();
canvas.onmousemove = function (event) {
	var mouseX = event.pageX - 8;
	var mouseY = event.clientY;
	for (i of macro.mics) {
		if (mouseX >= i.x - 5 && mouseX <= i.x + 5 + i.width && mouseY >= i.y && mouseY <= i.y + i.height) {
			i.hovered = true;
		} else {
			i.hovered = false;
		}
	}
	for (i of macro.intermods) {
		if (mouseX >= i.x - 5 && mouseX <= i.x + 5 + i.width && mouseY >= i.y && mouseY <= i.y + i.height) {
			i.hovered = true;
		} else {
			i.hovered = false;
		}
	}
}