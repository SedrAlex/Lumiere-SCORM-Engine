export class Lesson {
    constructor(private id: string, private title: string, private content: string) {}

    public render(): string {
        return `
            <div id="${this.id}" class="lesson">
                <h2>${this.title}</h2>
                <p>${this.content}</p>
            </div>
        `;
    }
}