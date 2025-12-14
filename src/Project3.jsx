import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Shuffle, RotateCcw, User, LogOut, Trophy, Gift, Zap, Star } from 'lucide-react';
import './Project3.css';

export default function ReindeerGamesPuzzle() {
  // Image options
  const IMAGES = {
    northpole: { url: '/North_pole.png', name: 'North Pole' },
    workshop: { url: '/workshop.png', name: 'Santa\'s Workshop' },
    christmas: { url: '/christmas.jpg', name: 'Christmas Night' }
  };
  

  //User Authentication
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '', email: '' });
  

  //Game
  const [selectedImage, setSelectedImage] = useState('northpole');
  const [puzzleSize, setPuzzleSize] = useState(4); // CORE REQ 3: Multi-size puzzles
  const [tiles, setTiles] = useState([]);
  const [emptyPos, setEmptyPos] = useState({ row: puzzleSize - 1, col: puzzleSize - 1 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [time, setTime] = useState(0);
  const [moves, setMoves] = useState(0); // CORE REQ 2: Track moves for competitive mode
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [initialConfig, setInitialConfig] = useState([]);
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [shakingTile, setShakingTile] = useState(null);
  const timerRef = useRef(null);


  //Leaderboard & Rankings
  const [leaderboard, setLeaderboard] = useState([]);


  //Festive Theme System
  const [currentTheme, setCurrentTheme] = useState('classic');
  const themes = {
    classic: {
      primary: '#BB2528',
      secondary: '#8B1A1D',
      name: 'Merry Christmas',
      background: 'Christmas_background.jpg'
    },
    winter: { 
      primary: '#4A90E2', 
      secondary: '#2C5F8D', 
      name: 'Winter Wonderland',
      background: 'blue_wrapping_paper.jpg'
    },
    green: {
      primary: '#2E7D32',
      secondary: '#1B5E20',
      name: 'Christmas Tree',
      background: 'christmas_wrapping_paper.jpg'
    }
  };


  //Holiday Power-Ups
  const [powerUps, setPowerUps] = useState({ hints: 3, timeFreeze: 2, autoSolve: 1 });
  const [timeFrozen, setTimeFrozen] = useState(false);


  //Reward system
  const [achievements, setAchievements] = useState([]);
  const [showAchievement, setShowAchievement] = useState(null);
  const [userStats, setUserStats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    bestTime: null,
    totalMoves: 0
  });



  //Story Mode
  const [currentStoryChapter, setCurrentStoryChapter] = useState(0);
  const [showStory, setShowStory] = useState(false);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  
  const storyChapters = [
    {
      title: "Chapter 1: The Missing Reindeer",
      text: "The Grinch has scattered across the North Pole! Unscramble the puzzle to find them.",      
      image: 'northpole',
      puzzlesNeeded: 0
    },
    {
      title: "Chapter 2: The Workshop Emergency",
      text: "The elves' are behind on their presents! Unscramble the puzzle to help them finish the toys.",
      image: 'workshop',
      puzzlesNeeded: 1
    },
    {
      title: "Chapter 3: Christmas Eve Magic",
      text: "Christmas joy is fading! Unscramble the puzzle to bring back the holiday spirit.",
      image: 'christmas',
      puzzlesNeeded: 2
    },
    {
      title: "Epilogue: Mission Accomplished!",
      text: "Congradulations, Christmas is saved! Enjoy the holiday season knowing that you helped save Christmas!",      
      image: 'northpole',
      puzzlesNeeded: 3
    }
  ];

  


  //Performance Analytics
  const [sessionId, setSessionId] = useState(null);
  const [analyticsEvents, setAnalyticsEvents] = useState([]);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = IMAGES[selectedImage].url;
    setImageLoaded(false);
  }, [selectedImage]);

  useEffect(() => {
    if (imageLoaded) {
      initializePuzzle();
    }
  }, [imageLoaded, puzzleSize]);

  // Timer logic (with time freeze support)
  useEffect(() => {
    if (isPlaying && !isSolved && !timeFrozen) {
      timerRef.current = setInterval(() => {
        setTime(t => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isSolved, timeFrozen]);


  //Load Leaderboard
  const loadLeaderboard = async () => {
    try {
      const response = await fetch(`http://localhost/project3-backend/api/leaderboard.php?size=${puzzleSize}&limit=10`);
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setLeaderboard([]);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [puzzleSize]);


  //Puzzle Mechanics
  const initializePuzzle = () => {
    const totalTiles = puzzleSize * puzzleSize - 1;
    let nums = [...Array(totalTiles).keys()];
    do {
      nums = shuffleArray([...nums]);
    } while (!isSolvable(nums, puzzleSize) || isTooEasy(nums));
    
    const grid = [];
    let idx = 0;
    for (let r = 0; r < puzzleSize; r++) {
      grid[r] = [];
      for (let c = 0; c < puzzleSize; c++) {
        if (r === puzzleSize - 1 && c === puzzleSize - 1) {
          grid[r][c] = null;
        } else {
          grid[r][c] = nums[idx++];
        }
      }
    }
    setTiles(grid);
    setInitialConfig(JSON.parse(JSON.stringify(grid)));
    setEmptyPos({ row: puzzleSize - 1, col: puzzleSize - 1 });
  };

  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const isSolvable = (puzzle, size) => {
    let inversions = 0;
    for (let i = 0; i < puzzle.length; i++) {
      for (let j = i + 1; j < puzzle.length; j++) {
        if (puzzle[i] > puzzle[j]) inversions++;
      }
    }
    return inversions % 2 === 0;
  };

  const isTooEasy = (puzzle) => {
    let correct = 0;
    for (let i = 0; i < Math.min(10, puzzle.length); i++) {
      if (puzzle[i] === i) correct++;
    }
    return correct > 7;
  };

  const handleTileClick = (row, col) => {
    if (isSolved) return;
    
    if (!isPlaying && gameStarted) {
      setIsPlaying(true);
      trackAnalytics('first_move', { puzzleSize, theme: currentTheme });
    }

    const rowDiff = Math.abs(row - emptyPos.row);
    const colDiff = Math.abs(col - emptyPos.col);
    
    if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
      // Valid move
      const newTiles = tiles.map(r => [...r]);
      newTiles[emptyPos.row][emptyPos.col] = newTiles[row][col];
      newTiles[row][col] = null;
      setTiles(newTiles);
      setEmptyPos({ row, col });
      setMoves(moves + 1);

      trackAnalytics('move_made', { moves: moves + 1 });
      
      if (checkWin(newTiles)) {
        handlePuzzleSolved();
      }
    } else {
      // Invalid move - shake
      setShakingTile(`${row}-${col}`);
      setTimeout(() => setShakingTile(null), 300);
    }
  };

  const checkWin = (grid) => {
    let expected = 0;
    for (let r = 0; r < puzzleSize; r++) {
      for (let c = 0; c < puzzleSize; c++) {
        if (r === puzzleSize - 1 && c === puzzleSize - 1) {
          return grid[r][c] === null;
        }
        if (grid[r][c] !== expected) return false;
        expected++;
      }
    }
    return true;
  };


  //Puzzle Completion
  const handlePuzzleSolved = () => {
    setIsSolved(true);
    setIsPlaying(false);

    // Update puzzle count for story mode
    const newPuzzlesSolved = puzzlesSolved + 1;
    setPuzzlesSolved(newPuzzlesSolved);
    
    // Update stats
    const newStats = {
      ...userStats,
      gamesPlayed: userStats.gamesPlayed + 1,
      gamesWon: userStats.gamesWon + 1,
      bestTime: !userStats.bestTime || time < userStats.bestTime ? time : userStats.bestTime,
      totalMoves: userStats.totalMoves + moves
    };
    setUserStats(newStats);
    
    // Check for achievements
    checkAchievements(time, moves);
    
    // Story Mode progression
    if (newPuzzlesSolved <= storyChapters.length - 1) {
      setCurrentStoryChapter(newPuzzlesSolved);
      setShowStory(true);
      setTimeout(() => {
        setShowStory(false);
        if (newPuzzlesSolved < storyChapters.length - 1) {
          const nextChapter = storyChapters[newPuzzlesSolved];
          setSelectedImage(nextChapter.image);
        }
      }, 5000);
    }
    
    // Track analytics
    trackAnalytics('puzzle_completed', {
      time,
      moves,
      puzzleSize,
      theme: currentTheme,
      storyProgress: newPuzzlesSolved,
      powerUpsUsed: 6 - (powerUps.hints + powerUps.timeFreeze + powerUps.autoSolve)
    });
    
    setShowNameInput(true);
  };


  //Achievements
  const checkAchievements = (time, moves) => {
    const newAchievements = [];
    
    if (userStats.gamesWon === 0) {
      newAchievements.push({ name: 'First Victory!', description: 'Complete your first puzzle' });
    }
    if (time < 60) {
      newAchievements.push({ name: 'Speed Demon', description: 'Solve in under 60 seconds' });
    }
    if (moves < puzzleSize * puzzleSize * 2) {
      newAchievements.push({ name: 'Efficiency Expert', description: 'Solve with minimal moves' });
    }
    if (userStats.gamesWon + 1 >= 10) {
      newAchievements.push({ name: 'Puzzle Master', description: 'Win 10 games' });
    }
    
    if (newAchievements.length > 0) {
      setShowAchievement(newAchievements[0]);
      setTimeout(() => setShowAchievement(null), 5000);
      setAchievements([...achievements, ...newAchievements]);
    }
  };


  //Analytics Tracking
  const trackAnalytics = (eventType, data) => {
    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      data,
      sessionId
    };
    setAnalyticsEvents([...analyticsEvents, event]);
    
    // TODO: Send to backend
    console.log('Analytics event:', event);
  };


  //Save score to leaderboard
  const handleSaveScore = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name!');
      return;
    }

    try {
      const response = await fetch('http://localhost/project3-backend/api/scores/submit.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          username: playerName,
          time,
          moves,
          puzzleSize,
          theme: currentTheme,
          sessionId
        })
      });
      
      if (response.ok) {
        await loadLeaderboard();
        setShowNameInput(false);
        setPlayerName('');
      }
    } catch (error) {
      console.error('Failed to save score:', error);
    }
  };


  //Start game
  const handleStart = () => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    
    setGameStarted(true);
    setTime(0);
    setMoves(0);
    setIsSolved(false);
    setShowNameInput(false);
    setPlayerName('');
    setPowerUps({ hints: 3, timeFreeze: 2, autoSolve: 1 });
    
    // Start analytics session
    const newSessionId = Date.now().toString();
    setSessionId(newSessionId);
    trackAnalytics('game_started', { puzzleSize, theme: currentTheme });
    
    setTimeout(() => initializePuzzle(), 10);
  };

  const handleShuffle = () => {
    if (!isSolved && gameStarted) {
      initializePuzzle();
      trackAnalytics('puzzle_shuffled', {});
    }
  };

  const handleReset = () => {
    if (initialConfig.length > 0 && !isSolved) {
      setTiles(JSON.parse(JSON.stringify(initialConfig)));
      setEmptyPos({ row: puzzleSize - 1, col: puzzleSize - 1 });
      setTime(0);
      setMoves(0);
      setIsPlaying(false);
      trackAnalytics('puzzle_reset', {});
    }
  };


  //Authentication
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost/project3-backend/api/auth/login.php', {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authForm.username,
          password: authForm.password
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        setShowAuthModal(false);
        setUserStats(data.stats || userStats);
      } else {
        alert('Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setCurrentUser({ id: 1, username: authForm.username });
      setIsLoggedIn(true);
      setShowAuthModal(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost/project3-backend/api/auth/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      
      if (response.ok) {
        alert('Registration successful! Please login.');
        setAuthMode('login');
      } else {
        alert('Registration failed.');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration successful! Please login.');
      setAuthMode('login');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setGameStarted(false);
  };


  //Power-ups
  const useHint = () => {
    if (powerUps.hints > 0 && !isSolved) {
      setPowerUps({ ...powerUps, hints: powerUps.hints - 1 });
      alert('Hint: Look for tiles that are close to their correct position!');
      trackAnalytics('powerup_used', { type: 'hint' });
    }
  };

  const useTimeFreeze = () => {
    if (powerUps.timeFreeze > 0 && !isSolved && !timeFrozen) {
      setPowerUps({ ...powerUps, timeFreeze: powerUps.timeFreeze - 1 });
      setTimeFrozen(true);
      setTimeout(() => setTimeFrozen(false), 30000);
      alert('Timer frozen for 30 seconds!');
      trackAnalytics('powerup_used', { type: 'time_freeze' });
    }
  };

  const useAutoSolve = () => {
    if (powerUps.autoSolve > 0 && !isSolved) {
      setPowerUps({ ...powerUps, autoSolve: powerUps.autoSolve - 1 });
      alert('Auto-solve used! One tile moved closer to solution.');
      trackAnalytics('powerup_used', { type: 'auto_solve' });
      handlePuzzleSolved();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTileBackgroundPosition = (tileNumber) => {
    if (tileNumber === null) return '0 0';
    const row = Math.floor(tileNumber / puzzleSize);
    const col = tileNumber % puzzleSize;
    const percentage = 100 / (puzzleSize - 1);
    return `${col * -percentage}% ${row * -percentage}%`;
  };

  return (
    <div className="puzzle-container" style={{
      backgroundImage: `url(${process.env.PUBLIC_URL}/${themes[currentTheme].background})`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed'
    }}>
      {/* User Header */}
      <div className="user-header">
        {isLoggedIn ? (
          <>
            <User size={20} />
            <span>{currentUser?.username}</span>
            <button className="logout-button" onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </button>
          </>
        ) : (
          <button className="login-button" onClick={() => setShowAuthModal(true)}>
            <User size={16} />
            Login
          </button>
        )}
      </div>

      {/* Title */}
      <div className="title-section">
        <h1 className="title-heading">Reindeer Games</h1>
        <p className="title-subtitle">Christmas Sliding Puzzle</p>
      </div>

      {/* Game container */}
      <div className="game-container">
        {/* Timer */}
        <div className="timer-display" style={{
          background: `linear-gradient(135deg, ${themes[currentTheme].primary}, ${themes[currentTheme].secondary})`
        }}>
          <div className="timer-content">
            <Clock size={24} />
            <div className="timer-time">{formatTime(time)}</div>
            <div className="timer-label">{timeFrozen ? 'FROZEN ❄️' : 'Time'}</div>
          </div>
          <div style={{ marginLeft: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{moves}</div>
            <div style={{ fontSize: '0.8em' }}>Moves</div>
          </div>
        </div>

        {/* Welcome screen */}
        {!gameStarted && (
          <div className="welcome-screen">
            <h2 className="welcome-heading">
              Welcome to Reindeer Games!
            </h2>
            <p className="welcome-text">
              Select your puzzle size, theme, and image to begin!
            </p>

            {/* Puzzle size selector */}
            <div className="theme-selector">
              <h3 className="theme-heading">Puzzle Size:</h3>
              <div className="theme-buttons">
                {[3, 4, 6].map((size) => (
                  <button
                    key={size}
                    onClick={() => setPuzzleSize(size)}
                    className={`theme-button ${puzzleSize === size ? 'theme-button-active' : ''}`}
                  >
                    {size}x{size}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme selector */}
            <div className="theme-selector">
              <h3 className="theme-heading">Choose Your Theme:</h3>
              <div className="theme-buttons">
                {Object.entries(themes).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => setCurrentTheme(key)}
                    className={`theme-button ${currentTheme === key ? 'theme-button-active' : ''}`}
                    style={{
                      background: currentTheme === key 
                        ? `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
                        : 'white',
                      color: currentTheme === key ? 'white' : '#BB2528'
                    }}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Image selector */}
            <div className="theme-selector">
              <h3 className="theme-heading">Choose Your Image:</h3>
              <div className="theme-buttons">
                {Object.entries(IMAGES).map(([key, img]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedImage(key)}
                    className={`theme-button ${selectedImage === key ? 'theme-button-active' : ''}`}
                  >
                    {img.name}
                  </button>
                ))}
              </div>
            </div>

            {imageLoaded && (
              <div className="preview-image-container">
                <img src={IMAGES[selectedImage].url} alt="Puzzle" className="preview-image" />
              </div>
            )}

            <button
              onClick={handleStart}
              disabled={!imageLoaded || !isLoggedIn}
              className="start-button"
            >
              <Play size={24} />
              {!isLoggedIn ? 'Login to Play' : imageLoaded ? 'START GAME' : 'Loading...'}
            </button>

            {/* User Stats Display */}
            {isLoggedIn && (
              <div style={{ marginTop: '20px', padding: '15px', background: '#f8f8f8', borderRadius: '10px' }}>
                <h3>Your Stats:</h3>
                <p>Games Won: {userStats.gamesWon} / {userStats.gamesPlayed}</p>
                <p>Best Time: {userStats.bestTime ? formatTime(userStats.bestTime) : 'N/A'}</p>
                <p>Total Moves: {userStats.totalMoves}</p>
              </div>
            )}

            {/* Story Mode Progress */}
            {isLoggedIn && puzzlesSolved > 0 && (
              <div style={{ 
                marginTop: '20px', 
                padding: '15px', 
                background: 'linear-gradient(135deg, #BB2528, #8B1A1D)',
                borderRadius: '10px',
                color: 'white'
              }}>
                <h3 style={{ margin: '0 0 10px 0' }}>🎄 Christmas Story Progress 🎄</h3>
                <p style={{ margin: '5px 0' }}>
                  {currentStoryChapter < storyChapters.length - 1 
                    ? `Current Chapter: ${storyChapters[currentStoryChapter].title}`
                    : 'Story Complete! 🎉'}
                </p>
                <p style={{ margin: '5px 0' }}>
                  Puzzles Completed: {puzzlesSolved} / {storyChapters.length - 1}
                </p>
                <div style={{ 
                  marginTop: '10px',
                  background: 'rgba(255,255,255,0.3)',
                  borderRadius: '10px',
                  height: '20px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: 'white',
                    height: '100%',
                    width: `${(puzzlesSolved / (storyChapters.length - 1)) * 100}%`,
                    transition: 'width 0.5s ease'
                  }}></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Puzzle grid */}
        {gameStarted && imageLoaded && (
          <>
            {/* Power-ups */}
            <div className="powerups-container">
              <button
                className="powerup-button powerup-hint"
                disabled={powerUps.hints === 0 || isSolved}
                onClick={useHint}
              >
                <Zap size={16} />
                Hint <span className="powerup-count">{powerUps.hints}</span>
              </button>
              <button
                className="powerup-button powerup-freeze"
                disabled={powerUps.timeFreeze === 0 || isSolved || timeFrozen}
                onClick={useTimeFreeze}
              >
                <Clock size={16} />
                Freeze <span className="powerup-count">{powerUps.timeFreeze}</span>
              </button>
              <button
                className="powerup-button powerup-solve"
                disabled={powerUps.autoSolve === 0 || isSolved}
                onClick={useAutoSolve}
              >
                <Star size={16} />
                Auto-Solve <span className="powerup-count">{powerUps.autoSolve}</span>
              </button>
            </div>

            <div className="puzzle-grid" style={{
              background: `linear-gradient(135deg, ${themes[currentTheme].secondary}, ${themes[currentTheme].primary})`,
              gridTemplateColumns: `repeat(${puzzleSize}, 1fr)`
            }}>
              {tiles.map((row, rowIndex) =>
                row.map((tile, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleTileClick(rowIndex, colIndex)}
                    className={`puzzle-tile ${tile === null ? 'puzzle-tile-empty' : 'puzzle-tile-filled'} ${
                      shakingTile === `${rowIndex}-${colIndex}` ? 'shake' : ''
                    }`}
                    style={{
                      background: tile === null ? undefined : `url(${IMAGES[selectedImage].url})`,
                      backgroundPosition: tile === null ? undefined : getTileBackgroundPosition(tile),
                      border: tile === null ? '2px dashed rgba(255,255,255,0.3)' : `2px solid ${themes[currentTheme].primary}`
                    }}
                  >
                  </div>
                ))
              )}
            </div>

            {/* Control buttons */}
            <div className="control-buttons">
              <button
                onClick={handleShuffle}
                disabled={isSolved}
                className="control-button shuffle-button"
              >
                <Shuffle size={20} />
                SHUFFLE
              </button>

              <button
                onClick={handleReset}
                disabled={isSolved}
                className="control-button reset-button"
              >
                <RotateCcw size={20} />
                RESET
              </button>
            </div>

            {/* Name input after completion */}
            {isSolved && showNameInput && (
              <div className="win-message">
                <h2>🎉 Congratulations! 🎉</h2>
                <p className="win-time">Time: {formatTime(time)}</p>
                <p>Moves: {moves}</p>
                
                <div style={{ marginTop: '20px' }}>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveScore()}
                    className="form-input"
                    style={{ marginBottom: '10px' }}
                  />
                  <button onClick={handleSaveScore} className="submit-button">
                    Save to Leaderboard
                  </button>
                </div>
              </div>
            )}

            {/* Play again */}
            {isSolved && !showNameInput && (
              <div className="win-message">
                <h2>Score Saved!</h2>
                <button onClick={handleStart} className="play-again-button">
                  <Play size={20} />
                  Play Again
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* LEADERBOARD */}
      <div className="leaderboard-container">
        <h2 className="leaderboard-title">
          <Trophy size={30} style={{ verticalAlign: 'middle', marginRight: '10px' }} />
          LEADERBOARD ({puzzleSize}x{puzzleSize})
        </h2>
        <div className="leaderboard-content">
          {leaderboard.length === 0 ? (
            <div className="leaderboard-empty">
              No scores yet for {puzzleSize}x{puzzleSize}. Be the first!
            </div>
          ) : (
            leaderboard.map((entry, index) => {
              let entryClass = 'leaderboard-entry leaderboard-entry-regular';
              let textColor = '#BB2528';
              
              if (index === 0) {
                entryClass = 'leaderboard-entry leaderboard-entry-gold';
                textColor = 'white';
              } else if (index === 1) {
                entryClass = 'leaderboard-entry leaderboard-entry-silver';
                textColor = 'white';
              } else if (index === 2) {
                entryClass = 'leaderboard-entry leaderboard-entry-bronze';
                textColor = 'white';
              }
              
              return (
                <div key={index} className={entryClass}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div className="leaderboard-rank" style={{ color: textColor }}>
                      {index + 1}.
                    </div>
                    <div className="leaderboard-name" style={{ color: textColor }}>
                      {entry.username}
                    </div>
                  </div>
                  <div style={{ fontSize: '1.1em', color: index < 3 ? 'white' : '#666' }}>
                    {formatTime(entry.time)} ({entry.moves} moves)
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              {authMode === 'login' ? 'Login' : 'Register'}
            </h2>
            <form className="modal-form" onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
              {authMode === 'register' && (
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={authForm.username}
                  onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                  required
                />
              </div>
              <div className="modal-buttons">
                <button type="submit" className="submit-button">
                  {authMode === 'login' ? 'Login' : 'Register'}
                </button>
                <button type="button" className="cancel-button" onClick={() => setShowAuthModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
            <p className="toggle-text">
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <span
                className="toggle-link"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              >
                {authMode === 'login' ? 'Sign up' : 'Login'}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Achievement Notification */}
      {showAchievement && (
        <div className="achievement-notification">
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <Gift size={40} />
          </div>
          <div className="achievement-title">Achievement Unlocked!</div>
          <div className="achievement-description">{showAchievement.name}</div>
          <div style={{ fontSize: '0.9em', marginTop: '5px' }}>{showAchievement.description}</div>
        </div>
      )}

      {/* Christmas Story Mode Modal */}
      {showStory && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#BB2528', marginBottom: '10px' }}>
                🎄 {storyChapters[currentStoryChapter].title} 🎄
              </h2>
            </div>
            <div style={{ 
              padding: '20px', 
              background: 'linear-gradient(135deg, #f8f8f8, #e8e8e8)',
              borderRadius: '10px',
              fontSize: '1.1em',
              lineHeight: '1.6',
              textAlign: 'center'
            }}>
              {storyChapters[currentStoryChapter].text}
            </div>
            <div style={{ 
              marginTop: '20px', 
              textAlign: 'center',
              fontSize: '0.9em',
              color: '#666'
            }}>
              {currentStoryChapter < storyChapters.length - 1 ? (
                <p>Progress: {puzzlesSolved} / {storyChapters.length - 1} puzzles completed</p>
              ) : (
                <p>🎉 Story Complete! 🎉</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
