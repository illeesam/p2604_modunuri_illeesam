package com.shopjoy.ecadminapi.base.ec.mb.mapper;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberSnsDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberSns;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface MbMemberSnsMapper {

    MbMemberSnsDto.Item selectById(@Param("id") String id);

    List<MbMemberSnsDto.Item> selectList(MbMemberSnsDto.Request req);

    List<MbMemberSnsDto.Item> selectPageList(MbMemberSnsDto.Request req);

    long selectPageCount(MbMemberSnsDto.Request req);

    int updateSelective(MbMemberSns entity);
}
