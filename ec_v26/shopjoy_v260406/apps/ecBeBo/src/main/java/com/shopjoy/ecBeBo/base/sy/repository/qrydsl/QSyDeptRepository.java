package com.shopjoy.ecBeBo.base.sy.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyDeptDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyDept;

import java.util.List;
import java.util.Optional;

/** SyDept QueryDSL Custom Repository */
public interface QSyDeptRepository {

    Optional<SyDeptDto.Item> selectById(String deptId);

    List<SyDeptDto.Item> selectList(SyDeptDto.Request search);

    BasePage<SyDeptDto.Item> selectPageData(SyDeptDto.Request search);

    int updateSelective(SyDept entity);

    /** 루트 dept + 모든 자손 dept_id 수집(트리조회, §14.6.9 — QueryDSL 전체조회 + 자바 BFS) */
    List<String> selectTreeDeptIds(String rootDeptId);
}
