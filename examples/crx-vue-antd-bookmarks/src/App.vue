<template>
  <div class="bookmark-container">
    <a-form>
      <a-form-item label="Search Bookmarks">
        <a-input-search
          v-model:value="searchValue"
          placeholder="input search text"
          style="width: 300px"
          @search="onSearch"
        />
      </a-form-item>
    </a-form>
    <a-tree
      v-model:expandedKeys="expandedKeys"
      :auto-expand-parent="autoExpandParent"
      :tree-data="treeData"
      :fieldNames="fieldNames"
      @expand="onExpand"
    >
      <template #title="{ title, url, id }">
        <div class="bookmark-text">
          <span
            v-if="title.indexOf(searchValue) > -1"
            :title="title"
            class="bookmark-text-link"
            @click="linkTo(url)"
          >
            {{ title.substr(0, title.indexOf(searchValue)) }}
            <span style="color: #f50">{{ searchValue }}</span>
            {{ title.substr(title.indexOf(searchValue) + searchValue.length) }}
          </span>
          <span
            v-else
            class="bookmark-text-link"
            :title="title"
            @click="linkTo(url)"
            >{{ title }}</span
          >
          <div class="bookmark-text-btns" v-if="url">
            <a-button type="link" size="small" @click="handleEdit(id, title)"
              >edit</a-button
            >
            <a-divider type="vertical" />
            <a-button danger type="link" size="small" @click="handleDelete(id)"
              >delete</a-button
            >
          </div>
        </div>
      </template>
    </a-tree>
  </div>
</template>

<script setup>
import { ref, createVNode } from 'vue'
import { Modal, Input } from 'ant-design-vue'
import 'ant-design-vue/es/modal/style/css'

const searchValue = ref('')
const bookmarkText = ref('')
const autoExpandParent = ref(true)
const expandedKeys = ref([])
const treeData = ref([])
const fieldNames = ref({
  children: 'children',
  title: 'title',
  key: 'dateAdded'
})

const dataList = []
const generateList = (data) => {
  for (let i = 0; i < data.length; i++) {
    const node = data[i]
    dataList.push({
      key: node.dateAdded,
      title: node.title
    })
    if (node.children) {
      generateList(node.children)
    }
  }
}

const getParentKey = (key, tree) => {
  let parentKey
  for (let i = 0; i < tree.length; i++) {
    const node = tree[i]
    if (node.children) {
      if (node.children.some((item) => item.dateAdded === key)) {
        parentKey = node.dateAdded
      } else if (getParentKey(key, node.children)) {
        parentKey = getParentKey(key, node.children)
      }
    }
  }
  return parentKey
}

function onExpand(keys) {
  expandedKeys.value = keys
  autoExpandParent.value = false
}

function getBookmarkTree() {
  chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
    console.log('bookmarkTreeNodes', bookmarkTreeNodes)
    if (bookmarkTreeNodes.length) {
      treeData.value = bookmarkTreeNodes[0].children.map((item, index) => {
        return {
          ...item,
          dateAdded: item.dateAdded + index
        }
      })
      generateList(treeData.value)
    }
  })
}

function onSearch(value) {
  const expanded = dataList
    .map((item) => {
      if (item.title.indexOf(value) > -1) {
        return getParentKey(item.key, treeData.value)
      }
      return null
    })
    .filter((item, i, self) => item && self.indexOf(item) === i)
  expandedKeys.value = expanded
  searchValue.value = value
  autoExpandParent.value = true
}

function linkTo(url) {
  if (url) {
    chrome.tabs.create({ url })
  }
}

function handleEdit(id, title) {
  if (id) {
    bookmarkText.value = title
    Modal.confirm({
      title: 'update bookmark',
      content: createVNode(Input, {
        defaultValue: bookmarkText.value,
        onChange: (e) => {
          bookmarkText.value = e.target.value
        }
      }),
      onOk() {
        chrome.bookmarks.update(id, {
          title: bookmarkText.value
        })
        getBookmarkTree()
      }
    })
  }
}
function handleDelete(id) {
  if (id) {
    Modal.confirm({
      title: 'Are you sure to delete the bookmark?',
      onOk() {
        chrome.bookmarks.remove(id)
        getBookmarkTree()
      }
    })
  }
}
document.addEventListener('DOMContentLoaded', function () {
  getBookmarkTree()
})
</script>

<style lang="less" scoped>
:deep(.ant-tree) {
  .ant-tree-node-content-wrapper {
    background-color: transparent;
    &.ant-tree-node-selected {
      background-color: transparent;
    }
  }
}
:deep(.ant-divider-vertical) {
  margin: 0 4px;
}
:deep(.ant-btn-sm) {
  font-size: 12px;
}
.bookmark {
  &-container {
    width: 580px;
    max-height: 660px;
  }
  &-text {
    display: flex;
    font-size: 12px;
    &-link {
      display: block;
      width: 360px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: pointer;
      &:hover {
        color: rgb(34, 96, 230);
      }
    }
    &-btns {
      margin-left: 4px;
    }
  }
}
</style>