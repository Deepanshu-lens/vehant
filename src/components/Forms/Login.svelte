<script lang="ts">
  import pb from "@/lib/sharedPB";
  import { Input } from "@/components/ui/input";
  import { userSchema } from "@/types";
  import { toast } from "svelte-sonner";
  import { validator } from "@felte/validator-zod";
  import Icon from "@iconify/svelte";
  import { createForm } from "felte";
  import { user } from "@/stores";

  if (pb.authStore.token) {
    console.log("HAVE IT");
    pb.authStore.clear();
  }

  if (window.api) {
    window.api.invoke("clear-auth-token");
  } else {
    localStorage.removeItem("pb_auth_token");
  }

  const loginSchema = userSchema.pick({ email: true });

  const { form, errors, reset, isSubmitting } = createForm({
    initialValues: { email: "", password: "" },
    extend: validator({ schema: loginSchema }),
    onSubmit: async (values) => {
      console.log("Form submitted with:", values);
      const response = await login(values.email, values.password);
      if (!response) {
        reset();
        return;
      }
      if (window.api) {
        window.api.navigate("/index");
      } else {
        window.location.href = "/";
      }
    },
    onError: (err) => {
      console.log("Form validation failed:", err);
    },
  });

  async function login(email: string, password: string) {
    let authData;
    try {
      authData = await pb.collection("users").authWithPassword(email, password);
    } catch (error: any) {
      if (error.message === "Failed to authenticate.") {
        toast.error("Invalid email or password. Please try again.");
        return;
      }
      toast.error("Authentication failed. Please try again.");
    }

    if (authData) {
      console.log(authData);
      user.set(authData.record);
      if (window.api) {
        await window.api.invoke("save-auth-token", pb.authStore.token);
      } else {
        localStorage.setItem("pb_auth_token", pb.authStore.token);
      }
      return authData;
    }
    toast.error("Authentication failed. Please try again.");
    return;
  }

  // $: $user && window && window.api
  //   ? window.api.navigate("/index")
  //   : (window.location.href = "/");
</script>

<form use:form class="space-y-4 w-full">
  <div class="grid w-full max-w-sm items-center gap-1.5">
    <div class="relative">
      <Icon
        icon="material-symbols:mail-rounded"
        class="w-22 h-22 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
      />
      <Input
        type="email"
        name="email"
        placeholder="Email Address"
        class="pl-10 w-full border border-gray-300 rounded-md"
      />
    </div>
    <div class="text-rose-500 text-xs">
      {#if $errors.email}
        {$errors.email}
      {/if}
    </div>
  </div>

  <div class="grid w-full max-w-sm items-center pb-4">
    <div class="relative">
      <Icon
        icon="material-symbols:password"
        class="w-22 h-22 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
      />
      <Input
        type="password"
        name="password"
        placeholder="Password"
        class="pl-10 w-full border border-gray-300 rounded-md"
      />
    </div>
    <div class="text-rose-500 text-xs">
      {#if $errors.password}
        {$errors.password}
      {/if}
    </div>
  </div>

  <div class="flex flex-col items-center justify-between mb-10 sm:mb-0">
    <button
      disabled={$isSubmitting}
      class="bg-[#015A62] hover:bg-[#015A62]/[.4] text-white font-bold py-2 px-4 rounded-md w-full focus:outline-none focus:shadow-outline"
      type="submit"
    >
      {#if $isSubmitting}
        Submitting ...
      {:else}
        Sign In
      {/if}
    </button>
    <button
      class="inline-block cursor-pointer align-baseline font-bold text-sm text-[#797c80] /[.7] mt-4"
      on:click={() => {
        if (window.api) {
          window.api.navigate("/register");
        } else {
          window.location.href = "/register";
        }
      }}
    >
      Don't have an account yet?
      <span class="ml-1 text-primary font-semibold"> Sign up </span>
    </button>
  </div>
</form>
