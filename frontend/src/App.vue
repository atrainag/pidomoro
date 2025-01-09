<template>
    <div id="app">
      <LayoutComponent>
        <router-view />
      </LayoutComponent>
    </div>
</template>
  
<script>
import LayoutComponent from '@/components/LayoutComponent.vue';

export default {
    name: 'App',
    components:{
        LayoutComponent,
    }
    };
</script>