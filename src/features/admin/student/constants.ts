export const STUDENT_GENDER_OPTIONS = ['남', '여'] as const;
export type StudentGender = (typeof STUDENT_GENDER_OPTIONS)[number];

export const STUDENT_DEPARTMENT_OPTIONS = [
    '컴퓨터공학과',
    '인공지능공학과',
    '디자인테크놀로지학과',
    '데이터사이언스학과',
    '스마트모빌리티공학과'
] as const;
export type StudentDepartment = (typeof STUDENT_DEPARTMENT_OPTIONS)[number];

export const STUDENT_ROLE_OPTIONS = ['재학생', '신입생', '새준위'] as const;
export type StudentRole = (typeof STUDENT_ROLE_OPTIONS)[number];

export const DEFAULT_DRAW_RANDOM_ROLES: StudentRole[] = ['재학생', '신입생'];

export const isStudentRole = (value: string): value is StudentRole => (
    (STUDENT_ROLE_OPTIONS as readonly string[]).includes(value)
);

