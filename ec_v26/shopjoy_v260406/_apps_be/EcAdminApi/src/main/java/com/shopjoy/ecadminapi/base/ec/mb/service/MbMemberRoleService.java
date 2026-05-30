package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberRoleDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberRole;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberRoleRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MbMemberRoleService {

    private final MbMemberRoleRepository mbMemberRoleRepository;

    @PersistenceContext
    private EntityManager em;

    /* 회원 역할 연결 키조회 */
    public MbMemberRoleDto.Item getById(String id) {
        MbMemberRoleDto.Item dto = mbMemberRoleRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbMemberRoleDto.Item getByIdOrNull(String id) {
        return mbMemberRoleRepository.selectById(id).orElse(null);
    }

    /* 회원 역할 연결 상세조회 */
    public MbMemberRole findById(String id) {
        return mbMemberRoleRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbMemberRole findByIdOrNull(String id) {
        return mbMemberRoleRepository.findById(id).orElse(null);
    }

    /* 회원 역할 연결 키검증 */
    public boolean existsById(String id) {
        return mbMemberRoleRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!mbMemberRoleRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 회원 역할 연결 목록조회 */
    public List<MbMemberRoleDto.Item> getList(MbMemberRoleDto.Request req) {
        return mbMemberRoleRepository.selectList(req);
    }

    /* 회원 역할 연결 페이지조회 */
    public MbMemberRoleDto.PageResponse getPageData(MbMemberRoleDto.Request req) {
        PageHelper.addPaging(req);
        return mbMemberRoleRepository.selectPageList(req);
    }

    /* 회원 역할 연결 등록 */
    @Transactional
    public MbMemberRole create(MbMemberRole body) {
        body.setMemberRoleId(CmUtil.generateId("mb_member_role"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        MbMemberRole saved = mbMemberRoleRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 회원 역할 연결 수정 */
    @Transactional
    public MbMemberRole update(String id, MbMemberRole body) {
        CmUtil.requireId(id, "id", this);
        MbMemberRole entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "memberRoleId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberRole saved = mbMemberRoleRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 회원 역할 연결 수정 */
    @Transactional
    public MbMemberRole updateSelective(MbMemberRole entity) {
        if (entity.getMemberRoleId() == null) throw new CmBizException("memberRoleId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getMemberRoleId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getMemberRoleId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = mbMemberRoleRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 회원 역할 연결 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        MbMemberRole entity = findById(id);
        mbMemberRoleRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public MbMemberRole save(String cmd, MbMemberRole entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getMemberRoleId() == null || entity.getMemberRoleId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getMemberRoleId() == null)
                    throw new CmBizException("삭제 대상 memberRoleId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!mbMemberRoleRepository.existsById(entity.getMemberRoleId()))
                    throw new CmBizException("존재하지 않는 MbMemberRole입니다: " + entity.getMemberRoleId() + "::" + CmUtil.svcCallerInfo(this));
                mbMemberRoleRepository.deleteById(entity.getMemberRoleId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setMemberRoleId(CmUtil.generateId("mb_member_role"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                MbMemberRole saved = mbMemberRoleRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getMemberRoleId() == null)
                    throw new CmBizException("수정 대상 memberRoleId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = mbMemberRoleRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 MbMemberRole입니다: " + entity.getMemberRoleId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getMemberRoleId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<MbMemberRole> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (MbMemberRole row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getMemberRoleId() == null || row.getMemberRoleId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, MbMemberRole::getMemberRoleId, "U", "memberRoleId", this);
            CmUtil.requireRowIds(rows, MbMemberRole::getMemberRoleId, "D", "memberRoleId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(MbMemberRole::getMemberRoleId)
                .toList();
            if (!deleteIds.isEmpty()) {
                mbMemberRoleRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<MbMemberRole> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (MbMemberRole row : updateRows) {
                row.setUpdBy(authId);
                int affected = mbMemberRoleRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getMemberRoleId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<MbMemberRole> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (MbMemberRole row : insertRows) {
                row.setMemberRoleId(CmUtil.generateId("mb_member_role"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                mbMemberRoleRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
