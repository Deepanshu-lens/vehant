<script lang="ts">
  import pb from "@/lib/sharedPB";
  import { Input } from "@/components/ui/input";
  import { userSchema } from "@/types";
  import { toast } from "svelte-sonner";
  import { createForm } from "felte";
  import { validator } from "@felte/validator-zod";
  import Icon from "@iconify/svelte";
  import { z } from "zod";
  import { Button } from "@/components/ui/button";

  const registerSchema = userSchema
    .pick({
      name: true,
      email: true,
    })
    .extend({
      password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long." }),
      confirmPassword: z.string().min(8, {
        message: "Confirm Password must be at least 8 characters long",
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords must match",
      path: ["confirmPassword"],
    });

  const { form, errors, reset, isSubmitting } = createForm({
    initialValues: { name: "", email: "", password: "", confirmPassword: "" },
    extend: validator({ schema: registerSchema }),
    onSubmit: async (values) => {
      console.log("Form submitted with:", values);
      const response = await register(
        values.name,
        values.email,
        values.password
      );
      //   if (!response) reset();
      if (response) {
        toast.success(`${values.name.split(" ")[0]}, welcome to Vehant.`);
        reset();
        if (window.api) {
          window.api.navigate("/login");
        } else {
          window.location.href = "/login";
        }
        return;
      }
    },
    onError: (err) => {
      console.log("Form validation failed:", err);
    },
  });

  async function register(name: string, email: string, password: string) {
    let authData;
    let session;
    try {
      session = await pb.collection("session").create({ owned: true });
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      return;
    }
    try {
      authData = await pb.collection("users").create({
        name: name,
        email: email,
        password: password,
        passwordConfirm: password,
        session: session.id,
      });
    } catch (error) {
      toast.error("Registration failed. Please try again.");
      return;
    }
    if (authData) {
      return authData;
    }
    toast.error("Registration failed. Please try again.");
    return;
  }
</script>

<form use:form class="space-y-4 w-full">
  <div class="grid w-full max-w-sm items-center gap-1.5">
    <div class="relative">
      <Icon
        icon="material-symbols:user-attributes"
        class="w-22 h-22 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
      />
      <Input
        type="text"
        name="name"
        placeholder="Full Name"
        class="pl-10 w-full border border-gray-300 rounded-md"
      />
    </div>
    <div class="text-rose-500 text-xs">
      {#if $errors.name}
        {$errors.name}
      {/if}
    </div>
  </div>

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

  <div class="grid w-full max-w-sm items-center pb-4">
    <div class="relative">
      <Icon
        icon="material-symbols:password"
        class="w-22 h-22 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
      />
      <Input
        type="password"
        name="confirmPassword"
        placeholder="Confirm Password"
        class="pl-10 w-full border border-gray-300 rounded-md"
    />
    </div>
    <div class="text-rose-500 text-xs">
      {#if $errors.confirmPassword}
        {$errors.confirmPassword}
      {/if}
    </div>
  </div>

  <div class="flex flex-col items-center justify-between mb-10 sm:mb-0">
    <Button
      variant="vehant"
      disabled={$isSubmitting}
      class="text-white font-bold py-2 px-4 rounded-md w-full focus:outline-none focus:shadow-outline"
      type="submit"
    >
      {#if $isSubmitting}
        Submitting ...
      {:else}
        Sign In
      {/if}
    </Button>
    <button
      class="inline-block cursor-pointer align-baseline font-bold text-sm text-[#797c80] /[.7] mt-4"
      on:click={() => {
        if (window.api) {
          window.api.navigate("/login");
        } else {
          window.location.href = "/login";
        }
      }}
    >
      Already have an account?
      <span class="ml-1 text-primary font-semibold"> Log In </span>
    </button>
  </div>
</form>
