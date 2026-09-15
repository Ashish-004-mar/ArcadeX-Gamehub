CREATE DATABASE IF NOT EXISTS gamehub_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gamehub_db;

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    category_id INT NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(500),
    embed_url VARCHAR(700) NOT NULL,
    difficulty ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Easy',
    tags VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    play_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_games_category FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS home_settings (
    id TINYINT PRIMARY KEY,
    hero_eyebrow VARCHAR(120),
    hero_title VARCHAR(180) NOT NULL,
    hero_description TEXT NOT NULL,
    featured_heading VARCHAR(120) DEFAULT 'Games worth playing',
    category_heading VARCHAR(120) DEFAULT 'Choose your style',
    cta_heading VARCHAR(180) DEFAULT 'Pick a game. Hit play. Have fun.',
    cta_button VARCHAR(100) DEFAULT 'Browse Game Library',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS home_featured_games (
    game_id INT PRIMARY KEY,
    position INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_home_featured_game FOREIGN KEY(game_id) REFERENCES games(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS home_categories (
    category_id INT PRIMARY KEY,
    position INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_home_category FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message VARCHAR(500) NOT NULL,
    link_url VARCHAR(700) NULL,
    days INT NOT NULL DEFAULT 7,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
) ENGINE=InnoDB;

-- 1. Insert Game Categories
INSERT IGNORE INTO categories (name, slug, description, icon, status) 
VALUES 
    ('Racing', 'racing', 'Fast cars, tight corners and high-speed challenges.', '🏎️', 'active'),
    ('Action', 'action', 'Quick reactions, combat and intense missions.', '⚔️', 'active'),
    ('Puzzle', 'puzzle', 'Logic, matching and brain-teasing challenges.', '🧩', 'active'),
    ('Sports', 'sports', 'Compete, score and chase the high score.', '🏆', 'active'),
    ('Adventure', 'adventure', 'Explore, survive and uncover new worlds.', '🗺️', 'active'),
    ('Arcade', 'arcade', 'Simple controls, big scores and instant fun.', '🕹️', 'active'),
    ('Strategy', 'strategy', 'Think ahead, build your plan and win.', '♟️', 'active');

-- 2. Insert Home Page Settings
INSERT INTO home_settings (
    id, 
    hero_eyebrow, 
    hero_title, 
    hero_description, 
    featured_heading, 
    category_heading, 
    cta_heading, 
    cta_button
) 
VALUES (
    1, 
    'PLAY • DISCOVER • REPEAT', 
    'Your next game is waiting.', 
    'Discover fast, fun browser games across racing, action, puzzles, sports, adventure and more.', 
    'Games worth playing', 
    'Choose your style', 
    'Pick a game. Hit play. Have fun.', 
    'Browse Game Library'
) 
ON DUPLICATE KEY UPDATE id = id;

-- 3. Insert Games
INSERT IGNORE INTO games (title, slug, category_id, description, thumbnail_url, embed_url, difficulty, tags, status) 
VALUES 
    ('Stack Fire Ball', 'stack-fire-ball', (SELECT id FROM categories WHERE slug='arcade'), 'Smash a blazing fireball down a rotating helix tower to reach the base. Hold to drop through colored platforms, release to dodge deadly black segments, and build combos to unlock unstoppable fireball mode.\r\n\r\nHold: Click or tap to drop and smash.\r\nRelease: Stop before hitting black tiles.\r\nFireball: Combo hits to destroy everything.', 'https://www.onlinegames.io/media/posts/184/responsive/Stack-Fire-Ball-Game-xs.jpg', 'https://www.onlinegames.io/games/2021/unity/stack-fire-ball/index.html', 'Easy', '1-player,3d,arcade,avoid,ball,color,crazy,destroy,free,mobile,mouse,skill', 'active'),
    ('Stickman GTA City', 'stickman-gta-city', (SELECT id FROM categories WHERE slug='action'), 'You\'ve been digging the internet for ages, looking for a free GTA game to play on your browser, only to end up with games that disappoint faster than a balloon losing air. You might have given up hope, reminiscing about the days of cruising through GTA San Andreas or Vice City with your bro.', 'https://www.onlinegames.io/media/posts/900/responsive/stickman-gta-city-free-xs.jpg', 'https://cloud.onlinegames.io/games/2024/unity3/stickman-gta-city/index-og.html', 'Easy', '1-player, 3d, action, adventure, battle, car, driving, free, gta, gun, shooting, simulator, traffic, unity, weapon', 'active'),
    ('Masked Special Forces', 'masked-special-forces', (SELECT id FROM categories WHERE slug='action'), 'Masked Special Forces is a multiplayer first-person shooter game with a myriad of customization options. The game puts you in the shoes of a commander in the battle arena. As a talented warrior, team up, strategize, and take down the opponents one by one.', 'https://www.onlinegames.io/media/posts/310/responsive/Masked-Special-Forces-FPS-xs.jpg', 'https://www.onlinegames.io/games/2022/unity2/masked-special-forces/index.html', 'Hard', '3d, action, armor, battle-royale, first-person-shooter, free, gun, io-games, multiplayer, shooting, war, weapon', 'active'),
    ('Guerrillas io', 'guerrillas-io', (SELECT id FROM categories WHERE slug='action'), 'You are a particular elite team member and are called into battle. Your weapons are ready, and your equipment is prepared. All your team needs is you. Guerrillas io is a multiplayer battling game that you can play online.', 'https://www.onlinegames.io/media/posts/423/responsive/Guerillas-io-xs.jpg', 'https://www.onlinegames.io/games/2023/unity2/guerrillas-io/index.html', 'Medium', '3d, action, army, battle-royale, first-person-shooter, free, io-games, shooting', 'active'),
    ('Stickman Parkour', 'stickman-parkour', (SELECT id FROM categories WHERE slug='adventure'), 'Stickman Parkour is a free online platformer from FreezeNova Games Studio built around easy-to-learn but hard-to-master movement mechanics. You play as a tiny stick figure on a mission to collect golden keys hidden throughout 30 levels, each key unlocking an ancient gate that leads deeper into the adventure.', 'https://www.onlinegames.io/media/posts/871/responsive/stickman-parkour-OG-xs.jpg', 'https://cloud.onlinegames.io/games/2024/construct/219/stickman-parkour/index-og.html', 'Medium', '1-player, 2d, action, adventure, arcade, free, fun, mobile, parkour, physics, running, stickman', 'active'),
    ('Cube Worlds', 'cube-worlds', (SELECT id FROM categories WHERE slug='adventure'), 'Cube Worlds brings back that exact feeling of building castles and digging tunnels in Minecraft Classic, but even more casual. It\'s the kind of block game you can fire up when you\'re between classes, stuck inside on a rainy day, or just in the mood to zone out and make something awesome. There\'s no survival pressure, no mobs creeping up behind you.', 'https://www.onlinegames.io/media/posts/986/responsive/Cube-Worlds-xs.jpg', 'https://cloud.onlinegames.io/games/2025/html/cube-worlds/index-og.html', 'Easy', '1-player, 3d, adventure, block, crafting, free, sandbox, simulator', 'active'),
    ('Cat Simulator', 'cat-simulator', (SELECT id FROM categories WHERE slug='adventure'), 'Purrr! Cat Simulator is a game where you purrr a lot. You are playing as a cat. You have the option to choose your cat\'s species and explore the world through feline eyes.', 'https://www.onlinegames.io/media/posts/330/responsive/Cat-Simulator-Online-xs.jpg', 'https://www.onlinegames.io/games/2022/unity4/cat-simulator/index.html', 'Easy', '1-player, 3d, adventure, animal, cat, cozy, crazy, cute, free, fun, kids, pet, simulator', 'active'),
    ('Marble Run', 'marble-run', (SELECT id FROM categories WHERE slug='arcade'), 'Marble Run is a free online obstacle-course game where you guide a striped beach ball across a series of narrow, candy-colored platforms suspended over open water. Roll forward automatically, steer around spinning obstacles, and collect coins scattered along the path as you race through 30 increasingly tricky levels.', 'https://www.onlinegames.io/media/posts/1354/responsive/marble-run-xs.webp', 'https://cloud.onlinegames.io/games/2026/galatrix/marble-run/game.html', 'Hard', '3d, arcade, avoid, ball, crazy, endless, fun, html5, kids, mobile, physics, running, skill,', 'active'),
    ('Snaker io', 'snaker-io', (SELECT id FROM categories WHERE slug='arcade'), 'Snaker io is a multiplayer snake game in which you guide your little snake on an arena full of neon food pellets. To grow the snake, collect as many pellets as you can while trying to survive in the arena with many other snakes. Avoid crashing into others or eating your own tail!', 'https://www.onlinegames.io/media/posts/1261/responsive/snaker-io-xs.webp', 'https://cloud.onlinegames.io/games/2026/more/snaker-io/game.html', 'Medium', '2d, arcade, arena, avoid, battle-royale, endless, free, fun, html5, io-games, kids, mobile, mouse, multiplayer, snake', 'active'),
    ('Get On Top', 'get-on-top', (SELECT id FROM categories WHERE slug='arcade'), 'Get On Top is a physics-based 2-player stickman wrestling game that turns childhood floor scuffles into a chaotic ragdoll brawl. Two stickman fighters grapple, flip, and flail across the screen, each trying to pin the other by forcing their opponent\'s head into the ground.', 'https://www.onlinegames.io/media/posts/697/responsive/Get-on-Top-xs.jpg', 'https://www.onlinegames.io/games/2024/code/6/get-on-top/index.html', 'Medium', '2-player, 2d, action, arcade, battle, combat, crazy, free, fun, html5, physics, stickman', 'active');

-- 4. Set Featured Games
INSERT IGNORE INTO home_featured_games (game_id, position) 
SELECT id, id 
FROM games 
WHERE status = 'active' 
ORDER BY id 
LIMIT 6;

-- 5. Set Home Categories
INSERT IGNORE INTO home_categories (category_id, position) 
SELECT id, id 
FROM categories 
WHERE status = 'active' 
ORDER BY id 
LIMIT 7;

-- For databases created before announcement links were added, run: 
-- ALTER TABLE announcements ADD COLUMN link_url VARCHAR(700) NULL AFTER message;
