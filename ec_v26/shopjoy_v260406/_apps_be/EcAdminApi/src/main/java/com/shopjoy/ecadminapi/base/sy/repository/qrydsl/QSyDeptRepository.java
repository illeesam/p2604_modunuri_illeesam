package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyDeptDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyDept;

import java.util.List;
import java.util.Optional;

/** SyDept QueryDSL Custom Repository */
public interface QSyDeptRepository {

    Optional<SyDeptDto.Item> selectById(String deptId);

    List<SyDeptDto.Item> selectList(SyDeptDto.Request search);

    SyDeptDto.PageResponse selectPageList(SyDeptDto.Request search);

    int updateSelective(SyDept entity);
}
