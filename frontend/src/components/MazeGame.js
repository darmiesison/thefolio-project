import React, { useState, useEffect, useCallback } from 'react';

const maze = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,1],
    [1,1,1,0,1,0,1,0,1,0,1,0,1,0,1],
    [1,0,0,0,1,0,1,0,0,0,1,0,1,0,1],
    [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,1,0,0,0,1,0,1],
    [1,0,1,0,1,1,1,0,1,1,1,0,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
    [1,1,1,0,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,0,1,1,1,1,1,0,1,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

function MazeGame() {

  const startPos = { x: 1, y: 1 };
  const end = { x: 13, y: 10 };

  const [pos, setPos] = useState(startPos);
  const [active, setActive] = useState(false);
  const [time, setTime] = useState(0);
  const [showConsole, setShowConsole] = useState(false);

  const win = pos.x === end.x && pos.y === end.y;

  // Movement handler
  const movePlayer = useCallback((dx, dy) => {
    if (!active || win) return;
    if (maze[pos.y + dy][pos.x + dx] === 0) {
      setPos({ x: pos.x + dx, y: pos.y + dy });
    }
  }, [pos, active, win]);
  // Keyboard controls
  useEffect(() => {
    const walk = (e) => {

      if (!active || win) return;

      const keys = {
        ArrowUp: [0,-1],
        ArrowDown: [0,1],
        ArrowLeft: [-1,0],
        ArrowRight: [1,0]
      };

      if (keys[e.key]) {
        e.preventDefault();
        const [dx,dy] = keys[e.key];
        movePlayer(dx, dy);
      }
    };

    window.addEventListener('keydown', walk);
    return () => window.removeEventListener('keydown', walk);

  }, [movePlayer, active, win]);


  // Timer
  useEffect(() => {

    let timer;

    if (active && !win) {
      timer = setInterval(() => {
        setTime(t => t + 1);
      },1000);
    }

    return () => clearInterval(timer);

  }, [active, win]);


  // Reset game
  function resetGame() {
    setPos(startPos);
    setTime(0);
    setActive(true);
  }

  return (
    <section className="cat-maze-section">

      {!active ? (
        <button onClick={() => setActive(true)}>🎮 Start Maze Game</button>
      ) : (
        <>
          <h3>⏱ Time: {time}s</h3>

          <div id="maze-container">
            {maze.map((row,y) =>
              row.map((cell,x) => (
                <div
                  key={`${x}-${y}`}
                  className={`cell ${cell === 1 ? 'wall' : 'path'} ${x === end.x && y === end.y ? 'end' : ''}`}
                >

                  {x === pos.x && y === pos.y &&
                    <img src="assets/cat-icon.png" alt="cat" style={{width:'30px'}}/>
                  }

                </div>
              ))
            )}
          </div>

          <button className="maze-console-toggle" onClick={() => setShowConsole(!showConsole)}>
            {showConsole ? '🎮 Hide Controls' : '🎮 Show Controls'}
          </button>

          {showConsole && (
            <div className="maze-console">
              <button className="arrow-btn up" onClick={() => movePlayer(0, -1)}>▲</button>
              <div className="arrow-middle">
                <button className="arrow-btn left" onClick={() => movePlayer(-1, 0)}>◄</button>
                <button className="arrow-btn down" onClick={() => movePlayer(0, 1)}>▼</button>
                <button className="arrow-btn right" onClick={() => movePlayer(1, 0)}>►</button>
              </div>
            </div>
          )}
        </>
      )}

      {win && (
        <>
          <p className="success">🎉 You Escaped in {time} seconds!</p>
          <button onClick={resetGame}>🔁 Play Again</button>
        </>
      )}

    </section>
  );
}

export default MazeGame;