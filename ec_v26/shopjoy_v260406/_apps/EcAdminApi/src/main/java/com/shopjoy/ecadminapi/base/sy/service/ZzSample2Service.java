package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample2Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample2;
import com.shopjoy.ecadminapi.base.sy.mapper.ZzSample2Mapper;
import com.shopjoy.ecadminapi.base.sy.repository.ZzSample2Repository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ZzSample2Service {


    private final ZzSample2Mapper zzSample2Mapper;
    private final ZzSample2Repository zzSample2Repository;

    /** getById — 조회 */
    @Transactional(readOnly = true)
    public ZzSample2Dto getById(String id) {
        // zz_sample2 :: select one :: id [orm:mybatis]
        return zzSample2Mapper.selectById(id);
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<ZzSample2Dto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // zz_sample2 :: select list :: p [orm:mybatis]
        return zzSample2Mapper.selectList(p);
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<ZzSample2Dto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // zz_sample2 :: select page :: p [orm:mybatis]
        return PageResult.of(zzSample2Mapper.selectPageList(p), zzSample2Mapper.selectPageCount(p),
            PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(ZzSample2 entity) {
        // zz_sample2 :: update :: entity [orm:mybatis]
        return zzSample2Mapper.updateSelective(entity);
    }

    /** create — 생성 */
    @Transactional
    public ZzSample2 create(ZzSample2 entity) {
        entity.setSample2Id(CmUtil.generateId("zz_sample2"));
        entity.setRgtr(SecurityUtil.getAuthUser().authId());
        entity.setRegDt(LocalDate.now());
        // zz_sample2 :: insert or update :: [orm:jpa]
        return zzSample2Repository.save(entity);
    }

    /** save — 저장 */
    @Transactional
    public ZzSample2 save(ZzSample2 entity) {
        if (!zzSample2Repository.existsById(entity.getSample2Id()))
            throw new CmBizException("존재하지 않는 ZzSample2입니다: " + entity.getSample2Id());
        entity.setMdfr(SecurityUtil.getAuthUser().authId());
        entity.setMdfcnDt(LocalDate.now());
        // zz_sample2 :: insert or update :: [orm:jpa]
        return zzSample2Repository.save(entity);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!zzSample2Repository.existsById(id))
            throw new CmBizException("존재하지 않는 ZzSample2입니다: " + id);
        // zz_sample2 :: delete :: id [orm:jpa]
        zzSample2Repository.deleteById(id);
    }

}
