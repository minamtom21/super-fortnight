// 学習項目のデータ。ここを増やすと、チェックリストも増やせます。
const lessons = [
  {
    id: "repository",
    title: "リポジトリを知る",
    description: "プロジェクトを入れる「箱」の役割を理解する"
  },
  {
    id: "readme",
    title: "READMEを書く",
    description: "プロジェクトの説明書を作る"
  },
  {
    id: "commit",
    title: "変更をコミットする",
    description: "作業の記録を残す"
  },
  {
    id: "branch",
    title: "ブランチを作る",
    description: "安全に新しい作業場所を作る"
  },
  {
    id: "pull-request",
    title: "プルリクエストを送る",
    description: "変更を取り込んでもらう提案をする"
  }
];

const savedProgress = JSON.parse(localStorage.getItem("github-beginner-progress") || "[]");
const savedName = localStorage.getItem("github-beginner-name") || "";
const completedLessons = new Set(savedProgress);

const checklist = document.querySelector("#checklist");
const progressText = document.querySelector("#progress-text");
const progressBarFill = document.querySelector("#progress-bar-fill");
const levelBadge = document.querySelector("#level-badge");
const profileForm = document.querySelector("#profile-form");
const nameInput = document.querySelector("#user-name");
const welcomeMessage = document.querySelector("#welcome-message");

function renderChecklist() {
  checklist.innerHTML = lessons.map((lesson) => {
    const isDone = completedLessons.has(lesson.id);
    return `
      <div class="check-item ${isDone ? "is-done" : ""}">
        <input type="checkbox" id="${lesson.id}" data-lesson-id="${lesson.id}" ${isDone ? "checked" : ""}>
        <label for="${lesson.id}">
          <strong>${lesson.title}</strong>
          <small>${lesson.description}</small>
        </label>
      </div>
    `;
  }).join("");

  checklist.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        completedLessons.add(checkbox.dataset.lessonId);
      } else {
        completedLessons.delete(checkbox.dataset.lessonId);
      }
      saveProgress();
      renderChecklist();
    });
  });

  updateProgress();
}

function updateProgress() {
  const count = completedLessons.size;
  const percentage = Math.round((count / lessons.length) * 100);
  progressText.textContent = `${count} / ${lessons.length} 完了`;
  progressBarFill.style.width = `${percentage}%`;

  if (count === lessons.length) {
    levelBadge.textContent = "GitHub入門マスター";
  } else if (count >= 3) {
    levelBadge.textContent = "もうすぐマスター";
  } else if (count > 0) {
    levelBadge.textContent = "一歩前進";
  } else {
    levelBadge.textContent = "はじめたばかり";
  }
}

function saveProgress() {
  localStorage.setItem("github-beginner-progress", JSON.stringify([...completedLessons]));
}

function showWelcome(name) {
  const trimmedName = name.trim();
  if (!trimmedName) {
    welcomeMessage.hidden = true;
    localStorage.removeItem("github-beginner-name");
    return;
  }
  nameInput.value = trimmedName;
  welcomeMessage.textContent = `${trimmedName}さんの学習カードを作りました。できた項目にチェックを入れてみましょう！`;
  welcomeMessage.hidden = false;
  localStorage.setItem("github-beginner-name", trimmedName);
}

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  showWelcome(nameInput.value);
});

document.querySelector("#reset-button").addEventListener("click", () => {
  if (!confirm("学習の進み具合と名前をリセットしますか？")) return;
  completedLessons.clear();
  localStorage.removeItem("github-beginner-progress");
  localStorage.removeItem("github-beginner-name");
  nameInput.value = "";
  welcomeMessage.hidden = true;
  renderChecklist();
});

renderChecklist();
if (savedName) showWelcome(savedName);
