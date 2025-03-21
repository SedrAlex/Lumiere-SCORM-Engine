export class ScormDataModel {
    private scormAPI = ScormAPI.getInstance();

    public setLessonStatus(status: string): boolean {
        return this.scormAPI.setValue("cmi.core.lesson_status", status);
    }

    public getLessonStatus(): string {
        return this.scormAPI.getValue("cmi.core.lesson_status");
    }

    public setScore(score: number): boolean {
        return this.scormAPI.setValue("cmi.core.score.raw", score.toString());
    }

    public getScore(): number {
        return parseFloat(this.scormAPI.getValue("cmi.core.score.raw"));
    }

    public commit(): boolean {
        return this.scormAPI.commit();
    }
}