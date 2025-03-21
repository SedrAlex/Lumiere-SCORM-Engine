import { Lesson } from './Lesson';
import { ScormDataModel } from '../scorm/ScormDataModel';

export class Course {
    private lessons: Lesson[] = [];
    private scormDataModel = new ScormDataModel();

    constructor(private container: HTMLElement) {}

    public addLesson(lesson: Lesson): void {
        this.lessons.push(lesson);
    }

    public render(): void {
        this.container.innerHTML = this.lessons.map(lesson => lesson.render()).join('');
    }

    public start(): void {
        this.scormDataModel.setLessonStatus("incomplete");
        this.render();
    }

    public complete(): void {
        this.scormDataModel.setLessonStatus("completed");
        this.scormDataModel.setScore(100);
        this.scormDataModel.commit();
    }
}