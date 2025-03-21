import { Course } from './course/Course';
import { Lesson } from './course/Lesson';
import { ScormAPI } from './scorm/ScormAPI';

const scormAPI = ScormAPI.getInstance();
scormAPI.initialize();

const courseContainer = document.getElementById('course-container') as HTMLElement;
const course = new Course(courseContainer);

const lesson1 = new Lesson('lesson1', 'Lesson 1', 'This is the content of lesson 1.'); //test
const lesson2 = new Lesson('lesson2', 'Lesson 2', 'This is the content of lesson 2.');//test

course.addLesson(lesson1);
course.addLesson(lesson2);

course.start();
//simulation
setTimeout(() => {
    course.complete();
    scormAPI.terminate();
}, 5000);