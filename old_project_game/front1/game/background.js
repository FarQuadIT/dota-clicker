export class Background {
    constructor(assets) {
        this.assets = assets; // Ссылка на ресурсы
        this.backgroundX = 0; // Начальная позиция фона
        this.backgroundSpeed = 0; // Скорость прокрутки
        this.defaultSpeed = this.backgroundSpeed;
        this.isStopped = false
    }
    stopSpeed() {
        if (!this.isStopped){
        this.isStopped = true
        this.defaultSpeed = this.backgroundSpeed;
        this.backgroundSpeed = 0; }
    }
    setSpeed(speed) {
        this.defaultSpeed = speed;
        this.backgroundSpeed = speed; // Устанавливаем новую скорость
 
    }
    returnSpeed() {
        this.isStopped = false
        this.backgroundSpeed = this.defaultSpeed; // Устанавливаем новую скорость

    }
    resize(canvas) {
        const img = this.assets.backgroundImg;

        this.fixedHeight = canvas.height; // Фиксируем высоту как высоту холста
        this.fixedWidth = this.fixedHeight * (img.width / img.height); // Рассчитываем ширину пропорционально высоте
        // Устанавливаем параметры отрисовки
        this.offsetY = 0; // Фон всегда начинается с верхней части
    }

    draw(ctx, canvas) {
        const img = this.assets.backgroundImg;

        if (!this.fixedWidth || !this.fixedHeight) {
            this.resize(canvas); // Рассчитываем размеры при первом запуске
        }

        this.backgroundX -= this.backgroundSpeed; // Двигаем фон влево

        if (this.backgroundX <= -this.fixedWidth) { // Сбрасываем позицию
            this.backgroundX = 0;
        }

        // Отрисовываем основной фон и его копию для плавного перехода
        ctx.drawImage(
            img,
            this.backgroundX,
            this.offsetY,
            this.fixedWidth,
            this.fixedHeight
        );
        ctx.drawImage(
            img,
            this.backgroundX + this.fixedWidth,
            this.offsetY,
            this.fixedWidth,
            this.fixedHeight
        );
    }
}
