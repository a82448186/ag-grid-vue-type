import Vue from "vue";
import {Grid, ComponentUtil} from "ag-grid/main";
import {VueFrameworkFactory} from "./vueFrameworkFactory";
import {VueFrameworkComponentWrapper} from "./vueFrameworkComponentWrapper";

const watchedProperties = {};
const props = ['gridOptions'];
ComponentUtil.ALL_PROPERTIES.forEach((propertyName) => {
    props.push(propertyName);

    watchedProperties[propertyName] = function (val, oldVal) {
        this.processChanges(propertyName, val, oldVal);
    };
});
ComponentUtil.EVENTS.forEach((eventName) => {
    props.push(eventName);
});

export default Vue.extend({
    template: '<div></div>',
    props: props,
    data()  {
        return {
            _initialised: false,
            _destroyed: false,

            api: null,
            columnApi: null
        }
    },
    methods: {
        globalEventListener(eventType, event) {
            if (this._destroyed) {
                return;
            }

            // generically look up the eventType
            let emitter = this[eventType];
            if (emitter) {
                emitter(event);
            } else {
                // the app isnt listening for this - ignore it
            }
        },
        processChanges(propertyName, val, oldVal) {
            if (this._initialised) {
                let changes = {};
                changes[propertyName] = {currentValue: val, previousValue: oldVal};
                ComponentUtil.processOnChange(changes, this.gridOptions, this.api, this.columnApi);
            }
        }
    },
    mounted() {
        let frameworkComponentWrapper = new VueFrameworkComponentWrapper(this);
        let vueFrameworkFactory = new VueFrameworkFactory(this.$el, this);
        let gridOptions = ComponentUtil.copyAttributesToGridOptions(this.gridOptions, this);

        let gridParams = {
            globalEventListener: this.globalEventListener.bind(this),
            frameworkFactory: vueFrameworkFactory,
            seedBeanInstances: {
                frameworkComponentWrapper: frameworkComponentWrapper
            }
        };

        new Grid(this.$el, gridOptions, gridParams);

        if (this.gridOptions.api) {
            this.api = this.gridOptions.api;
        }

        if (this.gridOptions.columnApi) {
            this.columnApi = this.gridOptions.columnApi;
        }

        this._initialised = true;
    },
    watch: watchedProperties,
    destroyed() {
        if (this._initialised) {
            this.api.destroy();
            this._destroyed = true;
        }
    }
});

