<template>
    <div>
        <input id="input_email" @keydown.enter="$store.dispatch('login', {email, password})" v-model="email" >
        <input id="input_password" @keydown.enter="$store.dispatch('login', {email, password})" v-model="password" type="password">
        <button id="btn_login" @click="$store.dispatch('login', {email, password})">Log in</button>
        <button id="btn_logout" @click="$store.dispatch('logout')">Log out</button>
        <div id="div_email">Email: {{$store.state.email}}</div>
        <div id="div_capacity">Capacity Fraction{{$store.state.capacityFraction}}</div>
    </div>
    
</template>

<script>
    export default {
        name: "navbar",
        mounted() {
        },
        data() {
            return {
                email: '',
                password: ''
            }
        },
        methods: {
        }
    }
</script>

<style scoped>

</style>