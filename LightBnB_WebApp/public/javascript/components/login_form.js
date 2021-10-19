$(() => {
  const $logInForm = $(`
  <form id="login-form" class="login-form form-control">
      <p>Login</p>
      <div class="login-form__field-wrapper">
        <input class="form-control-lg" type="email" name="email" placeholder="Email">
      </div>
      <div class="login-form__field-wrapper">
          <input class="form-control-lg" type="password" name="password" placeholder="Password">
        </div>
      <div class="login-form__field-wrapper">
          <button>Login</button>
          <a id="login-form__cancel" href="#">Cancel</a>
      </div>
    </form>
  `);

  window.$logInForm = $logInForm;

  $logInForm.on("submit", function (event) {
    event.preventDefault();

    const data = $(this).serialize();
    logIn(data).then(json => {
      if (!json.user) {
        views_manager.show("error", "Failed to login");
        return;
      }
      header.update(json.user);
      views_manager.show("listings");
    });
  });

  $("body").on("click", "#login-form__cancel", function () {
    views_manager.show("listings");
    return false;
  });
});