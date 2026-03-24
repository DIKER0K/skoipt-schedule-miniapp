import { useEffect, useState } from "react";

// Типы для данных
interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  is_online: boolean;
  role: string;
  group: string;
  course: number;
  specialty: string;
  email: string;
  specialty_code: string;
  is_bot: boolean;
  created_at: string;
}

interface Lesson {
  subject: string | null;
  teacher: string | null;
  classroom: string | null;
  time: string | null;
}

interface ScheduleData {
  zero_lesson?: Record<string, Lesson>;
  days: Record<string, Record<string, Lesson>>;
}

interface Schedule {
  group_name: string;
  schedule: ScheduleData;
  shift_info: Record<string, any>;
  updated_at: string | null;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      setError("Токен не найден");
      setLoading(false);
      return;
    }

    // 1. Получаем данные пользователя
    fetch("http://localhost:8000/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка авторизации");
        return res.json();
      })
      .then((userData: User) => {
        setUser(userData);

        // 2. Формируем правильное имя группы: курс + группа (например, "4И")
        const scheduleGroupName = `${userData.course}${userData.group}`;

        // 3. Загружаем расписание с правильным именем группы
        return fetch(
          `http://10.10.10.3:3020/schedule/${encodeURIComponent(
            scheduleGroupName
          )}`
        );
      })
      .then((res) => {
        if (res.status === 404) {
          throw new Error(
            `Расписание для группы ${user?.course}${user?.group} не найдено`
          );
        }
        if (!res.ok)
          throw new Error(`Ошибка загрузки расписания: ${res.status}`);
        return res.json();
      })
      .then((scheduleData: Schedule) => {
        setSchedule(scheduleData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Ошибка:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div style={{ color: "red" }}>⚠️ {error}</div>;
  if (!user) return <div>Пользователь не найден</div>;

  console.log("User:", user);
  console.log("Schedule:", schedule);

  // Вспомогательная функция для отображения дня недели
  const renderDay = (dayName: string, lessons: Record<string, Lesson>) => {
    const lessonNumbers = Object.keys(lessons).sort((a, b) => {
      // Сортируем номера пар как числа (1, 2, 10, а не 1, 10, 2)
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      return numA - numB;
    });

    if (lessonNumbers.length === 0) return null;

    return (
      <div
        key={dayName}
        style={{
          marginBottom: "20px",
          border: "1px solid #ddd",
          padding: "10px",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0" }}>{dayName}</h3>
        {lessonNumbers.map((num) => {
          const lesson = lessons[num];
          return (
            <div
              key={num}
              style={{
                marginBottom: "8px",
                padding: "8px",
                background: "#2C2C2C",
                borderRadius: "4px",
              }}
            >
              <strong>
                {num}. {lesson.subject || "—"}
              </strong>
              <div style={{ fontSize: "14px", color: "#555" }}>
                {lesson.time && <span>⏰ {lesson.time} | </span>}
                {lesson.teacher && <span>👨‍🏫 {lesson.teacher} | </span>}
                {lesson.classroom && <span>🚪 {lesson.classroom}</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Формируем имя группы для отображения
  const scheduleGroupName = `${user.course}${user.group}`;

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>
        Привет, {user.first_name} {user.last_name}!
      </h1>
      <p>
        <strong>Группа:</strong> {scheduleGroupName} | <strong>Курс:</strong>{" "}
        {user.course} | <strong>Специальность:</strong> {user.specialty}
      </p>

      {schedule ? (
        <>
          <h2>📅 Расписание группы {schedule.group_name}</h2>
          {schedule.schedule.days &&
          Object.keys(schedule.schedule.days).length > 0 ? (
            Object.entries(schedule.schedule.days).map(([dayName, lessons]) =>
              renderDay(dayName, lessons)
            )
          ) : (
            <p>📭 Расписание на эту неделю пока пусто.</p>
          )}
          {schedule.updated_at && (
            <p style={{ fontSize: "12px", color: "#888" }}>
              🔄 Обновлено:{" "}
              {new Date(schedule.updated_at).toLocaleString("ru-RU")}
            </p>
          )}
        </>
      ) : (
        <p>⏳ Загрузка расписания...</p>
      )}
    </div>
  );
}

export default App;
