// Variables Globales
var DIRECTION = {
	IDLE: 0,
	UP: 1,
	DOWN: 2,
	LEFT: 3,
	RIGHT: 4,
};

var rounds = [5, 5, 3, 3, 2];
var colors = ['#1abc9c', '#2ecc71', '#3498db', '#8c52ff', '#9b59b6'];

// El objeto pelota (Cubo que rebota)
var Ball = {
	new: function (incrementedSpeed) {
		return {
			width: 18,
			height: 18,
			x: this.canvas.width / 2 - 9,
			y: this.canvas.height / 2 - 9,
			moveX: DIRECTION.IDLE,
			moveY: DIRECTION.IDLE,
			speed: incrementedSpeed || 7,
		};
	},
};

// El segundo jugador IA (La segunda linea que se mueve)
var Ai = {
	new: function (side) {
		return {
			width: 18,
			height: 180,
			x: side === 'left' ? 150 : this.canvas.width - 150,
			y: this.canvas.height / 2 - 35,
			score: 0,
			move: DIRECTION.IDLE,
			speed: 8,
		};
	},
};

var Game = {
	initialize: function () {
		this.canvas = document.querySelector('canvas');
		this.context = this.canvas.getContext('2d');

		this.canvas.width = 1400;
		this.canvas.height = 1000;

		this.canvas.style.width = this.canvas.width / 2 + 'px';
		this.canvas.style.height = this.canvas.height / 2 + 'px';

		this.player = Ai.new.call(this, 'left');
		this.ai = Ai.new.call(this, 'right');
		this.ball = Ball.new.call(this);

		this.ai.speed = 5;
		this.running = this.over = false;
		this.turn = this.ai;
		this.timer = this.round = 0;
		this.color = '#8c52ff';

		Pong.menu();
		Pong.listen();
	},

	endGameMenu: function (text) {
		// Cambiar la fuente y su color en el canvas canvas
		Pong.context.font = '45px Courier New';
		Pong.context.fillStyle = this.color;

		// Dibuja el rectangulo detras del 'Presiona cualquier tecla para iniciar'
		Pong.context.fillRect(Pong.canvas.width / 2 - 350, Pong.canvas.height / 2 - 48, 700, 100);

		// Cambiar el color del canvas
		Pong.context.fillStyle = '#ffffff';

		// Dibuja el texto del menu final ('Game Over' and 'Winner')
		Pong.context.fillText(text, Pong.canvas.width / 2, Pong.canvas.height / 2 + 15);

		document.body.classList.remove('game-screen-locked'); // Desbloquea la pantalla

		setTimeout(function () {
			Pong = Object.assign({}, Game);
			Pong.initialize();
		}, 3000);
	},

	menu: function () {
		// Dibuja todos los objetos del Pong en su estado actual
		Pong.draw();

		// Cambiar la font del canvas y su color
		this.context.font = '50px Courier New';
		this.context.fillStyle = this.color;

		// Dibuja el rectangulo detrass del "Presiona cualquier tecla para iniciar"
		this.context.fillRect(this.canvas.width / 2 - 350, this.canvas.height / 2 - 48, 700, 100);

		// Cambiar el color del canvas
		this.context.fillStyle = '#ffffff';

		// Draw the Dibuja el texto de "Presiona cualquier tecla para iniciar"
		this.context.fillText('Presiona "p" para iniciar', this.canvas.width / 2, this.canvas.height / 2 + 15);
	},

	// Actualiza todos los objetos (mueve al jugador, IA, pelota, Incremento de puntos, etc.)
	update: function () {
		if (!this.over) {
			// Si la pelota choca con los limites - Corregir las coordenadas en x e y.
			if (this.ball.x <= 0) Pong._resetTurn.call(this, this.ai, this.player);
			if (this.ball.x >= this.canvas.width - this.ball.width) Pong._resetTurn.call(this, this.player, this.ai);
			if (this.ball.y <= 0) this.ball.moveY = DIRECTION.DOWN;
			if (this.ball.y >= this.canvas.height - this.ball.height) this.ball.moveY = DIRECTION.UP;

			// Mueve al jugador si player.move fue actualizada por un evento en el teclado
			if (this.player.move === DIRECTION.UP) this.player.y -= this.player.speed;
			else if (this.player.move === DIRECTION.DOWN) this.player.y += this.player.speed;

			// En un nuevo servicio (comienzo de cada turno) mueva la pelota al lado correcto
			// y aleatorizar la dirección para agregar algo de desafío.
			if (Pong._turnDelayIsOver.call(this) && this.turn) {
				this.ball.moveX = this.turn === this.player ? DIRECTION.LEFT : DIRECTION.RIGHT;
				this.ball.moveY = [DIRECTION.UP, DIRECTION.DOWN][Math.round(Math.random())];
				this.ball.y = Math.floor(Math.random() * this.canvas.height - 200) + 200;
				this.turn = null;
			}

			// Si el jugador choca con los límites, actualiza las coordenadas x e y.
			if (this.player.y <= 0) this.player.y = 0;
			else if (this.player.y >= this.canvas.height - this.player.height) this.player.y = this.canvas.height - this.player.height;

			// Mueve la pelota en la dirección deseada en función de los valores moveY y moveX
			if (this.ball.moveY === DIRECTION.UP) this.ball.y -= this.ball.speed / 1.5;
			else if (this.ball.moveY === DIRECTION.DOWN) this.ball.y += this.ball.speed / 1.5;
			if (this.ball.moveX === DIRECTION.LEFT) this.ball.x -= this.ball.speed;
			else if (this.ball.moveX === DIRECTION.RIGHT) this.ball.x += this.ball.speed;

			// Se encarga del movimiento de la  ia (IA) ARRIBA y ABAJO
			if (this.ai.y > this.ball.y - this.ai.height / 2) {
				if (this.ball.moveX === DIRECTION.RIGHT) this.ai.y -= this.ai.speed / 1.5;
				else this.ai.y -= this.ai.speed / 4;
			}
			if (this.ai.y < this.ball.y - this.ai.height / 2) {
				if (this.ball.moveX === DIRECTION.RIGHT) this.ai.y += this.ai.speed / 1.5;
				else this.ai.y += this.ai.speed / 4;
			}

			// Se encanrga de la colision de la IA
			if (this.ai.y >= this.canvas.height - this.ai.height) this.ai.y = this.canvas.height - this.ai.height;
			else if (this.ai.y <= 0) this.ai.y = 0;

			// Se encarga de la colision del jugador con la pelota
			if (this.ball.x - this.ball.width <= this.player.x && this.ball.x >= this.player.x - this.player.width) {
				if (this.ball.y <= this.player.y + this.player.height && this.ball.y + this.ball.height >= this.player.y) {
					this.ball.x = this.player.x + this.ball.width;
					this.ball.moveX = DIRECTION.RIGHT;
				}
			}

			// Se encarga de la colision de la IA con la pelota
			if (this.ball.x - this.ball.width <= this.ai.x && this.ball.x >= this.ai.x - this.ai.width) {
				if (this.ball.y <= this.ai.y + this.ai.height && this.ball.y + this.ball.height >= this.ai.y) {
					this.ball.x = this.ai.x - this.ball.width;
					this.ball.moveX = DIRECTION.LEFT;
				}
			}
		}

		// Se encarga de la transicion de ronda
		// Verifica si el jugador gano la ronda
		if (this.player.score === rounds[this.round]) {
			// Revisa si hay mas niveles/rondas disponibles y muestra la pantalla de victoria
			// si es que no hay
			if (!rounds[this.round + 1]) {
				this.over = true;
				setTimeout(function () {
					Pong.endGameMenu('Ganaste!');
				}, 1000);
			} else {
				// Si queda otra ronda resetea todos los valores e incrementa el numero de ronda.
				this.color = this._generateRoundColor();
				this.player.score = this.ai.score = 0;
				this.player.speed += 0.5;
				this.ai.speed += 1;
				this.ball.speed += 1;
				this.round += 1;
			}
		}
		// Revisa parar ver si gano la IA.
		else if (this.ai.score === rounds[this.round]) {
			this.over = true;
			setTimeout(function () {
				Pong.endGameMenu('Juego Finalizado!');
			}, 1000);
		}
	},

	// Dibuja los objetos en el canvas.
	draw: function () {
		// Limpia el canvas
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// Pasa el FillStyle a negro
		this.context.fillStyle = this.color;

		// Dibuja el fondo
		this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

		// Pasa el fillStyle a blanco (Para las barras (jugadores) y la pelota)
		this.context.fillStyle = '#ffffff';

		// Dibuja al jugador
		this.context.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

		// Dibuja la IA
		this.context.fillRect(this.ai.x, this.ai.y, this.ai.width, this.ai.height);

		// Dibuja la pelota
		if (Pong._turnDelayIsOver.call(this)) {
			this.context.fillRect(this.ball.x, this.ball.y, this.ball.width, this.ball.height);
		}

		// Dibuja la red (separacion del medio)
		this.context.beginPath();
		this.context.setLineDash([7, 15]);
		this.context.moveTo(this.canvas.width / 2, this.canvas.height - 140);
		this.context.lineTo(this.canvas.width / 2, 140);
		this.context.lineWidth = 10;
		this.context.strokeStyle = '#ffffff';
		this.context.stroke();

		// Coloca la fuente default del canvas y la alinea al centro
		this.context.font = '100px Courier New';
		this.context.textAlign = 'center';

		// Dibuja los resultados del jugador (de la izq)
		this.context.fillText(this.player.score.toString(), this.canvas.width / 2 - 300, 200);

		// Dibuja los resultados de la IA (derecha)
		this.context.fillText(this.ai.score.toString(), this.canvas.width / 2 + 300, 200);

		// Cambia el tamaño de la fuente para los puntos en el centro
		this.context.font = '30px Courier New';

		// Dibuja el puntaje ganador (centro)
		this.context.fillText('Ronda ' + (Pong.round + 1), this.canvas.width / 2, 35);

		// Cambia el tamaño de la fuente para el puntaje del centro
		this.context.font = '40px Courier';

		// Dibuja el actual numero de ronda
		this.context.fillText(rounds[Pong.round] ? rounds[Pong.round] : rounds[Pong.round - 1], this.canvas.width / 2, 100);
	},

	loop: function () {
		Pong.update();
		Pong.draw();

		// Si el juego no termina dibuja el siguiente frame.
		if (!Pong.over) requestAnimationFrame(Pong.loop);
	},
	listen: function () {
		document.addEventListener('keydown', function (event) {
			if (event.key === 'p') {
				if (Pong.running === false) {
					Pong.running = true;
					window.scrollTo({
						top: 0,
						behavior: 'smooth',
					});
					document.body.classList.add('game-screen-locked'); // Clase para fijar la pantalla
					window.requestAnimationFrame(Pong.loop);
				}
			}

			if (event.keyCode === 38 || event.keyCode === 87) {
				// Se encarga de la flecha hacia arriba y la w
				Pong.player.move = DIRECTION.UP;
			} else if (event.keyCode === 40 || event.keyCode === 83) {
				// Se encarga de la flecha hacia abajo y la s.
				Pong.player.move = DIRECTION.DOWN;
			}
			// if (event.keyCode === 88) {
			// 	// Código ASCII para la tecla "x"
			// 	Pong.endGameMenu('Juego terminado por el usuario.');
			// }
		});

		// Frena el movimiento del jugador cuando no hay ninguna tecla presionada.
		document.addEventListener('keyup', function (event) {
			if (event.keyCode === 38 || event.keyCode === 87 || event.keyCode === 40 || event.keyCode === 83) {
				Pong.player.move = DIRECTION.IDLE;
			}
		});
	},

	// Resetea la posicion de la pelota, el turno del jugador y aplica un delay antes que comience la ronda siguiente.
	_resetTurn: function (victor, loser) {
		this.ball = Ball.new.call(this, this.ball.speed);
		this.turn = loser;
		this.timer = new Date().getTime();

		victor.score++;
	},

	// Espera a que haya un delay antes de cada turno
	_turnDelayIsOver: function () {
		return new Date().getTime() - this.timer >= 1000;
	},

	// Elige un color random para el fondo para cada nivel/ronda
	_generateRoundColor: function () {
		var newColor = colors[Math.floor(Math.random() * colors.length)];
		if (newColor === this.color) return Pong._generateRoundColor();
		return newColor;
	},
};

var Pong = Object.assign({}, Game);
Pong.initialize();

function scrollToTienda() {
	const targetSection = document.getElementById('tienda');
	const sectionTop = targetSection.offsetTop;
	window.scrollTo({
		top: sectionTop,
		behavior: 'smooth',
	});
}
const title = document.querySelector('.title');
const text = title.textContent;
const letters = text.split('');

title.textContent = '';

for (let i = 0; i < letters.length; i++) {
	const span = document.createElement('span');
	span.textContent = letters[i];
	span.style.animationDelay = `${0.08 * i}s`;
	title.appendChild(span);
}

function scrollToInventario() {
	const targetSection = document.getElementById('inventario');
	const sectionTop = targetSection.offsetTop;
	window.scrollTo({
		top: sectionTop,
		behavior: 'smooth',
	});
}
