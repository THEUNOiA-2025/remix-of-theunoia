export const PROJECT_VIDEOS = [
    "/Video/AI and machine learning.mp4",
    "/Video/Animation.mp4",
    "/Video/App development.mp4",
    "/Video/Business strategy.mp4",
    "/Video/Content writing.mp4",
    "/Video/Cyber security.mp4",
    "/Video/Data Science.mp4",
    "/Video/Digital marketing.mp4",
    "/Video/Finance and accounting.mp4",
    "/Video/Freelancing.mp4",
    "/Video/Graphic designing.mp4",
    "/Video/Interview preperation.mp4",
    "/Video/Leadership.mp4",
    "/Video/New Project 29 [4ED1F2C].mp4",
    "/Video/Personal branding.mp4",
    "/Video/Photography.mp4",
    "/Video/Public speaking.mp4",
    "/Video/Resume building.mp4",
    "/Video/Startup pitching.mp4",
    "/Video/Teaching and mentoring.mp4",
    "/Video/UI UX Design.mp4",
    "/Video/Video 1.mp4",
    "/Video/Video editing.mp4",
    "/Video/Web development.mp4",
    "/Video/WhatsApp Video 2026-01-16 at 2.07.43 AM.mp4",
    "/Video/WhatsApp Video 2026-01-28 at 6.24.41 PM.mp4",
    "/Video/demovid.mp4",
    "/Video/herovid.mp4",
    "/Video/sai.mp4",
    "/Video/video 3.mp4",
    "/Video/video1.mp4"
];

export const getRandomProjectVideo = () => {
    const randomIndex = Math.floor(Math.random() * PROJECT_VIDEOS.length);
    return PROJECT_VIDEOS[randomIndex];
};
