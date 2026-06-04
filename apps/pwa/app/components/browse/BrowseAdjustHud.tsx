// ?adjust=browse HUD — 操作说明显示条
// 用 .adjust-hud 共享样式 (跟 vinyl HUD 同款顶部黄字条)

export function BrowseAdjustHud() {
  return (
    <div className="adjust-hud" aria-hidden="true">
      <div>
        browse-weather adjust · <kbd>arrows</kbd> move · <kbd>+/-</kbd> scale · <kbd>[/]</kbd> width
        · <kbd>,/.</kbd> height · <kbd>shift</kbd> = big step · <kbd>P</kbd> print
      </div>
    </div>
  )
}
