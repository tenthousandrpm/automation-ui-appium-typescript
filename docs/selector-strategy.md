# Selector strategy

How this framework finds elements in ChefPlanner, a Jetpack Compose app, and why.

## Order of preference

1. **Compose `testTag`, exposed as a resource-id.** This is the default. Use `this.rid('tag')`, or `this.ridPattern('regex')` for tags with IDs in them.
2. **A single chained `UiSelector`** built on testTags (`childSelector`, `resourceIdMatches`). Use it when one tag isn't enough, for example to reach the text inside a tagged container.
3. **Visible text.** Only for the cases listed under [When text selectors are allowed](#when-text-selectors-are-allowed), and always with a comment explaining why.
4. **XPath.** Never. It's slow on UiAutomator2 and breaks whenever the Compose layout changes.

### Why not accessibility id?

Many mobile guides put `accessibility id` first. On Android it maps to `contentDescription`, which is the text TalkBack reads aloud. In ChefPlanner that text is in Spanish, meant for users, and can change for accessibility reasons. Filling it with IDs like `btn_generate_order` would hurt real screen-reader users. A `testTag` exists only for tests, has no effect on users, and stays the same when the copy changes.

## How testTags reach Appium

Compose doesn't expose `testTag` to UiAutomator by default. Each screen in ChefPlanner turns it on at its root with `testTagsAsResourceId`. The tags then show up as **bare** resource-ids, without the usual `com.app.chefplanner:id/` prefix:

```kotlin
// chefplanner: ui/pedido/PedidoScreen.kt
Scaffold(
    modifier = Modifier.semantics { testTagsAsResourceId = true },
    // ...
) {
    FloatingActionButton(
        onClick = { /* ... */ },
        modifier = Modifier.semantics { testTag = "pedido_fab_agregar" }
    ) { /* ... */ }
}
```

```ts
// src/screens/PedidoScreen.ts
get fabAgregar() { return $(this.rid('pedido_fab_agregar')); }
// rid() builds: android=new UiSelector().resourceId("pedido_fab_agregar")
```

### Naming

Tags follow `<screen>_<element>_<name>`. List rows add the database ID: `<screen>_item_<id>`.

| Tag | What it is |
|---|---|
| `pedido_fab_agregar` | Add button on Pedido |
| `pedido_btn_generar` | "Generar pedido" button |
| `pedido_dialog_cantidad_campo` | Quantity field in the quantity dialog |
| `pedido_item_row_42` | Row for order item 42 |
| `historico_pedido_7` | Row for confirmed order 7 in Histórico |
| `picker_ingrediente_3` | Ingredient 3 in the ingredient picker |

Use `ridPattern` when the ID isn't known in advance:

```ts
const rows = await $$(this.ridPattern('historico_pedido_\\d+'));
```

## Compose and UiAutomator2 quirks

These explain most of the non-obvious code in `src/screens/`.

**Popups don't inherit `testTagsAsResourceId`.** `DropdownMenu`, and dialogs that don't set the flag themselves, render in a separate window. Tags inside them are invisible to Appium, even though they exist in the Kotlin code. ChefPlanner's dialogs set the flag (for example `pedido_dialog_vaciar_confirmar` works), but its dropdown menus don't. That's why "Vaciar pedido" and the unit and supplier-type dropdowns in the ingredient form are matched by text.

**`LazyColumn` only renders visible rows.** Rows off screen aren't in the tree. Call `scrollToElement()` before looking for a row, and remember that `$$` counts only include visible rows.

**Child searches aren't scoped to the parent.** `parent.$(child)` can match an element anywhere on screen. Use one chained selector instead:

```ts
// GeneracionScreen: the card container has no text; its TextView child does
$('android=new UiSelector().resourceId("generacion_card_texto")'
  + '.childSelector(new UiSelector().className("android.widget.TextView"))');
```

Or match by position, like `PedidoScreen.findItemId()`, which finds the row whose bounds contain an ingredient name.

**Old screens stay in the tree.** Navigation keeps previous screens alive (`saveState`), so their nodes still count as present and even "displayed" after you leave. Don't use `waitForGone` to confirm navigation; wait for something on the new screen instead. Right after a bottom-nav switch, a tap can land before the screen is ready and be lost. `BaseScreen.tapUntilDisplayed()` retries the tap until its result appears.

**Container nodes have no text.** A tagged Compose container usually returns `""` from `getText()`. The text lives in child `TextView`s.

## When text selectors are allowed

Only when there's no testTag that Appium can reach:

| Case | Example | Why |
|---|---|---|
| Bottom navigation | `HomeScreen.pedidoTab` → `text("Pedido")` | `NavigationBarItem` merges its semantics and exposes only the label |
| Snackbars | `ConfiguracionScreen`: import success message | Snackbars have no testTag |
| Android system file picker | `ConfiguracionScreen.importBackup()` → `textContains("Downloads")` | DocumentsUI belongs to the OS, not the app |
| Dropdown menu items | `PedidoScreen.clearOrder()` → `text("Vaciar pedido")` | Rendered in a popup window (see above) |
| Finding a row by its data | `scrollToElement(text("Tomate"))` | The name is test data, not UI copy; the row's ID is then read from its testTag |

Every one of these needs a comment saying why. If a text selector is needed because a tag is missing from a screen the app controls, **add the tag to the app** instead. That's a one-line change in the chefplanner repo, and it beats a selector that breaks when the copy changes.

## Finding and checking selectors

Never guess a testTag. Check it in the live tree first. Neither tool can run while a test session is active, because both use the same UiAutomator2 server.

**uiautomator dump**, which is quick and needs no setup:

```bash
adb shell uiautomator dump /sdcard/ui.xml && adb shell cat /sdcard/ui.xml > ui.xml
grep -o 'resource-id="pedido_[^"]*"' ui.xml   # e.g. list Pedido's tags on screen
```

**Appium Inspector**, which lets you browse the tree interactively. The README has the server command and capabilities. Look at each node's `resource-id`: if it matches a testTag from the Compose code, `rid()` will find it. If the tag is in the Kotlin code but missing from the tree, the element is probably in a popup.

## Checklist for a new selector

1. Find the element's testTag in the chefplanner source (`grep -rn 'testTag = "' app/src`).
2. Confirm it appears as a `resource-id` in a dump or in Inspector.
3. Add it to the screen class with `rid()` or `ridPattern()`. Specs and flows never contain selectors.
4. No reachable tag? Add one to the app. If that isn't possible (system UI, or a popup you can't change), use text and comment why.
