export const PROJECT_VIDEOS = [
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//AI and machine learning.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//Animation.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//App development.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//Business strategy.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//Content writing.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//Cyber security.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//Data Science.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//demovid.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//Digital marketing.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//Finance and accounting.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//Freelancing.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//Graphic designing.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//HeroVideo.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//Interview preperation.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//Leadership.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//Personal branding.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//Photography.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//Public speaking.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//Resume building.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//sai.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//Startup pitching.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//Teaching and mentoring.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//UI UX Design.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//video 3 (1).mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//Video editing.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//video1.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//Web development.mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//WhatsApp Video 2026-01-16 at 2.07.43 AM (1).mp4",
    "https://oeleyonqaowubcfreqoy.supabase.co/storage/v1/object/public/videos//WhatsApp Video 2026-01-28 at 6.24.41 PM (1).mp4"
];

export const getRandomProjectVideo = () => {
    const randomIndex = Math.floor(Math.random() * PROJECT_VIDEOS.length);
    return PROJECT_VIDEOS[randomIndex];
};
