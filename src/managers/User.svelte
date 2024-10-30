<script lang="ts">
  import { onMount } from "svelte";
  import { validateUser } from "@/validateSchema";
  import pb from "@/lib/sharedPB";
  import { user } from "@/stores/user";

  async function authenticate() {
    if (window.api) {
      console.log("ELECTRON");
      return await window.api.invoke("get-auth-token");
    }
    return localStorage.getItem("pb_auth_token");
  }

  try {
    pb.collection("users").subscribe("*", (e) => {
      console.log("User collection updated", e.action, e.record);
      if (e.action === "update") {
        const validated = validateUser(e.record);
        if (validated)
          user.update((current) =>
            current.id === validated.id ? validated : current
          );
      }
    });
  } catch (error) {
    console.error("Failed realtime user");
  }

  onMount(() => {
    authenticate().then((token) => {
      if (token) {
        user.set(pb.authStore.model);
      } else {
        if (window.api) {
          window.api.navigate("/login");
        } else {
          window.location.href = "/login";
        }
      }
    });
  });
</script>
