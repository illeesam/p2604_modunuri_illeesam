package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscnt;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PmDiscntMapper {

    PmDiscntDto.Item selectById(@Param("id") String id);

    List<PmDiscntDto.Item> selectList(PmDiscntDto.Request req);

    List<PmDiscntDto.Item> selectPageList(PmDiscntDto.Request req);

    long selectPageCount(PmDiscntDto.Request req);

    int updateSelective(PmDiscnt entity);
}
