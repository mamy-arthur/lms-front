import { Course } from "./types";
import { CourseItem } from "./CourseItem";

type Props = {
    courses: Course[];
};

export function CourseList({ courses }: Props) {
    return (
        <>
            {courses.map((course) => (
                <CourseItem
                    key={course.id}
                    course={course}
                />
            ))}
        </>
    );
}